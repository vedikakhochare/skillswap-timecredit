import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    runTransaction
} from 'firebase/firestore';
import { transferCredits } from './transactionService';
import { db } from './firebase';

// Coerce Firestore Timestamp | Date | string into a JS Date
const toJsDate = (value: any): Date => {
    if (value && typeof value.toDate === 'function') {
        return value.toDate();
    }
    if (value instanceof Date) {
        return value;
    }
    return new Date(value);
};

export interface Skill {
    id?: string;
    title: string;
    description: string;
    category: string;
    creditsPerHour: number;
    availableSlots: number;
    providerId: string;
    providerName: string;
    providerAvatar?: string;
    rating?: number;
    reviewCount?: number;
    totalSessions?: number;
    responseTime?: string;
    bio?: string;
    highlights?: string[];
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

export interface Booking {
    id?: string;
    skillId: string;
    requesterId: string;
    providerId: string;
    providerName?: string;
    skillTitle?: string;
    date: Date;
    time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    credits: number;
    meetingUrl?: string | null;
    reviewed?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Transaction {
    id?: string;
    fromUserId: string;
    toUserId: string;
    skillId: string;
    bookingId: string;
    credits: number;
    type: 'earned' | 'spent';
    description: string;
    createdAt: Date;
}

export interface Review {
    id?: string;
    bookingId: string;
    skillId: string;
    reviewerId: string;
    providerId: string;
    rating: number; // 1-5
    comment?: string;
    createdAt: Date;
}

export const createSkill = async (skillData: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<string> => {
    const skill: Omit<Skill, 'id'> = {
        ...skillData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    console.log('Creating skill:', skill);
    const docRef = await addDoc(collection(db, 'skills'), skill);
    console.log('Skill created with ID:', docRef.id);
    return docRef.id;
};

export const getSkills = async (limitCount: number = 50): Promise<Skill[]> => {
    try {
        const skillsRef = collection(db, 'skills');
        // Try the composite query first (if index is ready)
        const q = query(skillsRef, where('isActive', '==', true), orderBy('createdAt', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Skill));
    } catch (error) {
        console.warn('Composite query failed, trying simpler query:', error);

        // Fallback to simpler query if composite index isn't ready yet
        try {
            const skillsRef = collection(db, 'skills');
            const simpleQ = query(skillsRef, where('isActive', '==', true), limit(limitCount));
            const simpleSnapshot = await getDocs(simpleQ);

            const skills = simpleSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Skill));

            // Sort in memory if composite query failed
            return skills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (fallbackError) {
            console.error('Both queries failed:', fallbackError);
            throw fallbackError;
        }
    }
};

export const getSkillById = async (skillId: string): Promise<Skill | null> => {
    const skillDoc = await getDoc(doc(db, 'skills', skillId));

    if (skillDoc.exists()) {
        return {
            id: skillDoc.id,
            ...skillDoc.data()
        } as Skill;
    }

    return null;
};

export const getUserSkills = async (userId: string): Promise<Skill[]> => {
    const skillsRef = collection(db, 'skills');
    const q = query(skillsRef, where('providerId', '==', userId), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Skill));
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const booking: Omit<Booking, 'id'> = {
        ...bookingData,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    console.log('Creating booking with data:', bookingData);

    try {
        console.log('Starting transaction...');
        // Use a transaction to ensure atomicity
        const result = await runTransaction(db, async (transaction) => {
            console.log('Inside transaction, reading data...');
            // First, do ALL reads before any writes
            const requesterRef = doc(db, 'userProfiles', bookingData.requesterId);
            const providerRef = doc(db, 'userProfiles', bookingData.providerId);
            const skillRef = doc(db, 'skills', bookingData.skillId);

            // Get current user data (all reads first)
            const [requesterSnap, providerSnap, skillSnap] = await Promise.all([
                transaction.get(requesterRef),
                transaction.get(providerRef),
                transaction.get(skillRef)
            ]);

            console.log('Read data results:', {
                requesterExists: requesterSnap.exists(),
                providerExists: providerSnap.exists(),
                skillExists: skillSnap.exists()
            });

            if (!requesterSnap.exists() || !providerSnap.exists() || !skillSnap.exists()) {
                throw new Error('User or skill not found');
            }

            const requester = requesterSnap.data();
            const provider = providerSnap.data();
            const skill = skillSnap.data();

            console.log('User data:', {
                requesterCredits: requester.credits,
                providerCredits: provider.credits,
                skillSlots: skill.availableSlots,
                requiredCredits: bookingData.credits
            });

            // For confirmed bookings, only validate available slots
            // Credits will be validated when the session is completed
            if (bookingData.status === 'confirmed') {
                console.log('Validating for confirmed booking...');
                // Check if skill has available slots
                if (skill.availableSlots <= 0) {
                    console.log('No available slots error');
                    throw new Error('No available slots');
                }
                console.log('Validation passed');
            } else {
                console.log('Creating pending booking - no validation needed');
            }

            // Now do ALL writes after all reads are complete
            console.log('Starting writes...');
            const bookingRef = doc(collection(db, 'bookings'));
            transaction.set(bookingRef, booking);
            console.log('Booking document created');

            // If status is confirmed, transfer credits and decrement slots
            if (bookingData.status === 'confirmed') {
                console.log('Transferring credits and updating slots...');
                
                // Decrement available slots
                transaction.update(skillRef, {
                    availableSlots: skill.availableSlots - 1,
                    updatedAt: new Date()
                });
                console.log('Slots updated');
            }

            console.log('Transaction completed successfully');
            return bookingRef.id;
        });

        console.log('Booking created successfully with ID:', result);
        
        // Credits will be transferred when the session is completed, not when confirmed
        return result;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('requesterId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    // Get skill information for each booking
    const bookingsWithSkillInfo = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
        const data = doc.data() as any;
            const skill = await getSkillById(data.skillId);

        return {
            id: doc.id,
            ...data,
                providerName: skill?.providerName || 'Unknown Provider',
                skillTitle: skill?.title || 'Unknown Skill',
            // Ensure dates are JS Date instances for UI formatting
            date: toJsDate(data.date),
            createdAt: toJsDate(data.createdAt),
            updatedAt: data.updatedAt ? toJsDate(data.updatedAt) : toJsDate(data.createdAt),
        } as Booking;
        })
    );

    return bookingsWithSkillInfo;
};

export const getProviderBookings = async (userId: string): Promise<Booking[]> => {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('providerId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    // Get skill information for each booking
    const bookingsWithSkillInfo = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
        const data = doc.data() as any;
            const skill = await getSkillById(data.skillId);

        return {
            id: doc.id,
            ...data,
                providerName: skill?.providerName || 'Unknown Provider',
                skillTitle: skill?.title || 'Unknown Skill',
            date: toJsDate(data.date),
            createdAt: toJsDate(data.createdAt),
            updatedAt: data.updatedAt ? toJsDate(data.updatedAt) : toJsDate(data.createdAt),
        } as Booking;
        })
    );

    return bookingsWithSkillInfo;
};

export const updateBookingStatus = async (
    bookingId: string,
    status: Booking['status'],
    extra?: Record<string, any>
): Promise<void> => {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
        status,
        updatedAt: new Date(),
        ...(extra || {}),
    });
};

// Mark a booking as completed and update skill stats
export const completeBooking = async (
    bookingId: string,
    options?: { meetingUrl?: string | null }
): Promise<void> => {
    try {
        // Use a transaction to ensure atomicity
        await runTransaction(db, async (transaction) => {
            // Read booking to get related data
            const bookingRef = doc(db, 'bookings', bookingId);
            const bookingSnap = await transaction.get(bookingRef);
            
            if (!bookingSnap.exists()) {
                throw new Error('Booking not found');
            }

            const booking = bookingSnap.data() as Booking;
            
            // Only process credits if booking is confirmed (not already processed)
            if (booking.status === 'confirmed') {
                // Get user profiles for credit transfer
                const requesterRef = doc(db, 'userProfiles', booking.requesterId);
                const providerRef = doc(db, 'userProfiles', booking.providerId);
                
                const [requesterSnap, providerSnap] = await Promise.all([
                    transaction.get(requesterRef),
                    transaction.get(providerRef)
                ]);

                if (!requesterSnap.exists() || !providerSnap.exists()) {
                    throw new Error('User profiles not found');
                }

                const requester = requesterSnap.data();
                const provider = providerSnap.data();

                // Validate sufficient credits
                if (requester.credits < booking.credits) {
                    throw new Error('Insufficient credits for session completion');
                }

                // Transfer credits
                transaction.update(requesterRef, {
                    credits: requester.credits - booking.credits,
                    updatedAt: new Date()
                });

                transaction.update(providerRef, {
                    credits: provider.credits + booking.credits,
                    updatedAt: new Date()
                });

                // Create transaction records
                const transactionRef = collection(db, 'transactions');
                const now = new Date();

                // Spent transaction for requester
                const spentTransactionRef = doc(transactionRef);
                transaction.set(spentTransactionRef, {
                    fromUserId: booking.requesterId,
                    toUserId: booking.providerId,
                    skillId: booking.skillId,
                    bookingId: bookingId,
                    credits: booking.credits,
                    type: 'spent',
                    description: `Session completed for ${booking.skillTitle || 'skill'}`,
                    status: 'completed',
                    createdAt: now,
                });

                // Earned transaction for provider
                const earnedTransactionRef = doc(transactionRef);
                transaction.set(earnedTransactionRef, {
                    fromUserId: booking.requesterId,
                    toUserId: booking.providerId,
                    skillId: booking.skillId,
                    bookingId: bookingId,
                    credits: booking.credits,
                    type: 'earned',
                    description: `Session completed for ${booking.skillTitle || 'skill'}`,
                    status: 'completed',
                    createdAt: now,
                });
            }

            // Update booking status to completed
            transaction.update(bookingRef, {
                status: 'completed',
                completedAt: new Date(),
                meetingUrl: options?.meetingUrl ?? null,
                updatedAt: new Date(),
            });

            // Increment the totalSessions for the skill
            const skillRef = doc(db, 'skills', booking.skillId);
            transaction.update(skillRef, {
                totalSessions: increment(1),
                updatedAt: new Date(),
            });
        });

        console.log('Booking completed successfully with credit transfer');
    } catch (error) {
        console.error('Error completing booking:', error);
        throw error;
    }
};

// Helper function to complete a session with proper credit transfer
export const completeSessionWithCredits = async (
    bookingId: string,
    options?: { meetingUrl?: string | null }
): Promise<{ success: boolean; message: string; transactionIds?: string[] }> => {
    try {
        // First, get the booking to check its status
        const bookingRef = doc(db, 'bookings', bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (!bookingSnap.exists()) {
            return { success: false, message: 'Booking not found' };
        }

        const booking = bookingSnap.data() as Booking;
        
        if (booking.status !== 'confirmed') {
            return { 
                success: false, 
                message: `Cannot complete session. Booking status is ${booking.status}. Only confirmed bookings can be completed.` 
            };
        }

        // Complete the booking (this will handle credit transfer)
        await completeBooking(bookingId, options);
        
        return { 
            success: true, 
            message: 'Session completed successfully. Credits have been transferred.' 
        };
    } catch (error) {
        console.error('Error completing session with credits:', error);
        return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
    }
};

export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> => {
    const transaction: Omit<Transaction, 'id'> = {
        ...transactionData,
        createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    return docRef.id;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('fromUserId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
            id: doc.id,
            ...data,
            createdAt: toJsDate(data.createdAt),
        } as Transaction;
    });
};

// Submit a review and update skill aggregate rating and reviewCount
export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
    const now = new Date();
    const reviewDoc = await addDoc(collection(db, 'reviews'), {
        ...review,
        createdAt: now,
    });

    // Update booking to mark reviewed
    try {
        await updateDoc(doc(db, 'bookings', review.bookingId), {
            reviewed: true,
            updatedAt: now,
        });
    } catch (error) {
        console.error('Error updating booking review status:', error);
    }

    // Update skill aggregates: rating and reviewCount
    const skillRef = doc(db, 'skills', review.skillId);
    const skillSnap = await getDoc(skillRef);
    if (skillSnap.exists()) {
        const data = skillSnap.data() as Skill;
        const currentCount = data.reviewCount || 0;
        const currentRating = data.rating || 0;
        const newCount = currentCount + 1;
        const newAvg = ((currentRating * currentCount) + review.rating) / newCount;
        await updateDoc(skillRef, {
            reviewCount: newCount,
            rating: Math.round(newAvg * 10) / 10,
            updatedAt: now,
        });
    }

    return reviewDoc.id;
};

export const getSkillReviews = async (skillId: string, limitCount: number = 20): Promise<Review[]> => {
    const qy = query(
        collection(db, 'reviews'),
        where('skillId', '==', skillId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Review));
};

export const getUserReviews = async (providerId: string, limitCount: number = 50): Promise<Review[]> => {
    const qy = query(
        collection(db, 'reviews'),
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Review));
};
