import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export const onBookingConfirmed = functions.firestore
    .document('bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        if (!before || !after) return;

        // Only process when status changes to 'confirmed' from 'pending'
        const movedToConfirmed = before.status === 'pending' && after.status === 'confirmed';
        if (!movedToConfirmed) return;

        const requesterId: string = after.requesterId;
        const providerId: string = after.providerId;
        const credits: number = after.credits;
        const skillId: string = after.skillId;
        const bookingId: string = context.params.bookingId;

        const requesterRef = db.collection('userProfiles').doc(requesterId);
        const providerRef = db.collection('userProfiles').doc(providerId);
        const skillRef = db.collection('skills').doc(skillId);
        const transactionsRef = db.collection('transactions');

        await db.runTransaction(async (t) => {
            const [requesterSnap, providerSnap, skillSnap] = await Promise.all([
                t.get(requesterRef),
                t.get(providerRef),
                t.get(skillRef),
            ]);

            if (!requesterSnap.exists || !providerSnap.exists || !skillSnap.exists) {
                throw new functions.https.HttpsError('failed-precondition', 'Missing user profiles or skill');
            }

            const requester = requesterSnap.data() as any;
            const provider = providerSnap.data() as any;
            const skill = skillSnap.data() as any;
            const requesterCredits = requester.credits || 0;
            const providerCredits = provider.credits || 0;

            if (requesterCredits < credits) {
                // Insufficient credits; revert booking to declined
                t.update(change.after.ref, { status: 'declined', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                return;
            }

            if (skill.availableSlots <= 0) {
                // No available slots; revert booking to declined
                t.update(change.after.ref, { status: 'declined', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                return;
            }

            // Move credits
            t.update(requesterRef, { credits: requesterCredits - credits });
            t.update(providerRef, { credits: providerCredits + credits });

            // Decrement available slots
            t.update(skillRef, {
                availableSlots: skill.availableSlots - 1,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            const now = admin.firestore.FieldValue.serverTimestamp();
            // Transactions
            t.set(transactionsRef.doc(), {
                fromUserId: requesterId,
                toUserId: providerId,
                skillId,
                bookingId,
                credits,
                type: 'spent',
                description: 'Booking confirmed',
                createdAt: now,
            });
            t.set(transactionsRef.doc(), {
                fromUserId: requesterId,
                toUserId: providerId,
                skillId,
                bookingId,
                credits,
                type: 'earned',
                description: 'Booking confirmed',
                createdAt: now,
            });

            t.update(change.after.ref, { confirmedAt: now, updatedAt: now });
        });
    });


