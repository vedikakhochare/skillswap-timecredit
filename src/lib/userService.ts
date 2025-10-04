import { doc, setDoc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';
import { Transaction } from './transactionService';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    credits: number;
    createdAt: Date;
    updatedAt: Date;
}

export const createUserProfile = async (user: User): Promise<UserProfile> => {
    const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
        credits: 10, // New users start with 10 credits
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Create user document in Firestore
    await setDoc(doc(db, 'userProfiles', user.uid), userProfile);

    return userProfile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDoc = await getDoc(doc(db, 'userProfiles', uid));

    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }

    return null;
};

export const updateUserCredits = async (uid: string, newCredits: number): Promise<void> => {
    await updateDoc(doc(db, 'userProfiles', uid), {
        credits: newCredits,
        updatedAt: new Date(),
    });
};

// Get user transaction history
export const getUserTransactionHistory = async (uid: string): Promise<Transaction[]> => {
    try {
        const transactionsRef = collection(db, 'transactions');
        
        // Query for transactions where user is either sender or receiver
        const sentQuery = query(
            transactionsRef,
            where('fromUserId', '==', uid),
            orderBy('createdAt', 'desc')
        );

        const receivedQuery = query(
            transactionsRef,
            where('toUserId', '==', uid),
            orderBy('createdAt', 'desc')
        );

        const [sentSnap, receivedSnap] = await Promise.all([
            getDocs(sentQuery),
            getDocs(receivedQuery)
        ]);

        const transactions: Transaction[] = [];

        // Process sent transactions
        sentSnap.docs.forEach(doc => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
            } as Transaction);
        });

        // Process received transactions
        receivedSnap.docs.forEach(doc => {
            const data = doc.data();
            transactions.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
            } as Transaction);
        });

        // Sort by creation date (most recent first)
        return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error('Error getting user transaction history:', error);
        return [];
    }
};

// Get user profile with transaction summary
export const getUserProfileWithHistory = async (uid: string): Promise<{
    profile: UserProfile | null;
    transactionHistory: Transaction[];
    summary: {
        totalEarned: number;
        totalSpent: number;
        netCredits: number;
        transactionCount: number;
    };
}> => {
    try {
        const [profile, transactionHistory] = await Promise.all([
            getUserProfile(uid),
            getUserTransactionHistory(uid)
        ]);

        const totalEarned = transactionHistory
            .filter(t => t.type === 'earned')
            .reduce((sum, t) => sum + t.credits, 0);
        
        const totalSpent = transactionHistory
            .filter(t => t.type === 'spent')
            .reduce((sum, t) => sum + t.credits, 0);
        
        const netCredits = totalEarned - totalSpent;

        return {
            profile,
            transactionHistory,
            summary: {
                totalEarned,
                totalSpent,
                netCredits,
                transactionCount: transactionHistory.length
            }
        };
    } catch (error) {
        console.error('Error getting user profile with history:', error);
        return {
            profile: null,
            transactionHistory: [],
            summary: {
                totalEarned: 0,
                totalSpent: 0,
                netCredits: 0,
                transactionCount: 0
            }
        };
    }
};
