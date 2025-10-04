"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBookingConfirmed = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
exports.onBookingConfirmed = functions.firestore
    .document('bookings/{bookingId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after)
        return;
    // Only process when status changes to 'confirmed' from 'pending'
    const movedToConfirmed = before.status === 'pending' && after.status === 'confirmed';
    if (!movedToConfirmed)
        return;
    const requesterId = after.requesterId;
    const providerId = after.providerId;
    const credits = after.credits;
    const skillId = after.skillId;
    const bookingId = context.params.bookingId;
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
        const requester = requesterSnap.data();
        const provider = providerSnap.data();
        const skill = skillSnap.data();
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
