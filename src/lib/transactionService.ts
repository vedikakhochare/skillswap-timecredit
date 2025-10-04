import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
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
  // Enhanced fields
  skillTitle?: string;
  fromUserName?: string;
  toUserName?: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface CreditTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
  skillId: string;
  bookingId: string;
  description: string;
}

// Create a transaction with proper validation
export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const transaction: Omit<Transaction, 'id'> = {
      ...transactionData,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    return docRef.id;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create transaction');
  }
};

// Transfer credits between users with atomic transaction
export const transferCredits = async (transfer: CreditTransfer): Promise<{ success: boolean; transactionIds: string[] }> => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // Get both user profiles
      const fromUserRef = doc(db, 'userProfiles', transfer.fromUserId);
      const toUserRef = doc(db, 'userProfiles', transfer.toUserId);
      
      const fromUserSnap = await transaction.get(fromUserRef);
      const toUserSnap = await transaction.get(toUserRef);

      if (!fromUserSnap.exists() || !toUserSnap.exists()) {
        throw new Error('One or both users not found');
      }

      const fromUser = fromUserSnap.data();
      const toUser = toUserSnap.data();

      // Validate sufficient credits
      if (fromUser.credits < transfer.amount) {
        throw new Error('Insufficient credits');
      }

      // Update user credits
      transaction.update(fromUserRef, {
        credits: fromUser.credits - transfer.amount,
        updatedAt: new Date()
      });

      transaction.update(toUserRef, {
        credits: toUser.credits + transfer.amount,
        updatedAt: new Date()
      });

      // Create transaction records
      const transactionRef = collection(db, 'transactions');
      const now = new Date();

      // Spent transaction for sender
      const spentTransactionRef = doc(transactionRef);
      transaction.set(spentTransactionRef, {
        fromUserId: transfer.fromUserId,
        toUserId: transfer.toUserId,
        skillId: transfer.skillId,
        bookingId: transfer.bookingId,
        credits: transfer.amount,
        type: 'spent',
        description: transfer.description,
        status: 'completed',
        createdAt: now,
      });

      // Earned transaction for receiver
      const earnedTransactionRef = doc(transactionRef);
      transaction.set(earnedTransactionRef, {
        fromUserId: transfer.fromUserId,
        toUserId: transfer.toUserId,
        skillId: transfer.skillId,
        bookingId: transfer.bookingId,
        credits: transfer.amount,
        type: 'earned',
        description: transfer.description,
        status: 'completed',
        createdAt: now,
      });

      return {
        spentTransactionId: spentTransactionRef.id,
        earnedTransactionId: earnedTransactionRef.id
      };
    });

    return {
      success: true,
      transactionIds: [result.spentTransactionId, result.earnedTransactionId]
    };
  } catch (error) {
    console.error('Error transferring credits:', error);
    throw error;
  }
};

// Get all transactions for a user (both sent and received)
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    
    // Query for transactions where user is either sender or receiver
    const q = query(
      transactionsRef,
      where('fromUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const q2 = query(
      transactionsRef,
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const [sentSnap, receivedSnap] = await Promise.all([
      getDocs(q),
      getDocs(q2)
    ]);

    const transactions: Transaction[] = [];

    // Process sent transactions
    sentSnap.docs.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        createdAt: toJsDate(data.createdAt),
      } as Transaction);
    });

    // Process received transactions
    receivedSnap.docs.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        createdAt: toJsDate(data.createdAt),
      } as Transaction);
    });

    // Sort by creation date (most recent first)
    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting user transactions:', error);
    return [];
  }
};

// Get enhanced transactions with user and skill details
export const getEnhancedUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactions = await getUserTransactions(userId);
    
    // Get unique user IDs and skill IDs
    const userIds = [...new Set([
      ...transactions.map(t => t.fromUserId),
      ...transactions.map(t => t.toUserId)
    ])];
    
    const skillIds = [...new Set(transactions.map(t => t.skillId))];

    // Fetch user profiles and skills in parallel
    const [userProfiles, skills] = await Promise.all([
      Promise.all(userIds.map(async (uid) => {
        const userDoc = await getDoc(doc(db, 'userProfiles', uid));
        return { uid, profile: userDoc.exists() ? userDoc.data() : null };
      })),
      Promise.all(skillIds.map(async (skillId) => {
        const skillDoc = await getDoc(doc(db, 'skills', skillId));
        return { skillId, skill: skillDoc.exists() ? skillDoc.data() : null };
      }))
    ]);

    // Create lookup maps
    const userMap = new Map(userProfiles.map(({ uid, profile }) => [uid, profile]));
    const skillMap = new Map(skills.map(({ skillId, skill }) => [skillId, skill]));

    // Enhance transactions with user and skill details
    return transactions.map(transaction => ({
      ...transaction,
      fromUserName: userMap.get(transaction.fromUserId)?.displayName || 'Unknown User',
      toUserName: userMap.get(transaction.toUserId)?.displayName || 'Unknown User',
      skillTitle: skillMap.get(transaction.skillId)?.title || 'Unknown Skill'
    }));
  } catch (error) {
    console.error('Error getting enhanced transactions:', error);
    return [];
  }
};

// Get transaction summary for a user
export const getTransactionSummary = async (userId: string): Promise<{
  totalEarned: number;
  totalSpent: number;
  netCredits: number;
  transactionCount: number;
  recentTransactions: Transaction[];
}> => {
  try {
    const transactions = await getUserTransactions(userId);
    
    const totalEarned = transactions
      .filter(t => t.type === 'earned')
      .reduce((sum, t) => sum + t.credits, 0);
    
    const totalSpent = transactions
      .filter(t => t.type === 'spent')
      .reduce((sum, t) => sum + t.credits, 0);
    
    const netCredits = totalEarned - totalSpent;
    const recentTransactions = transactions.slice(0, 5);

    return {
      totalEarned,
      totalSpent,
      netCredits,
      transactionCount: transactions.length,
      recentTransactions
    };
  } catch (error) {
    console.error('Error getting transaction summary:', error);
    return {
      totalEarned: 0,
      totalSpent: 0,
      netCredits: 0,
      transactionCount: 0,
      recentTransactions: []
    };
  }
};

// Real-time transaction listener
export const subscribeToUserTransactions = (
  userId: string,
  callback: (transactions: Transaction[]) => void
) => {
  const transactionsRef = collection(db, 'transactions');
  
  // Listen to both sent and received transactions
  const sentQuery = query(
    transactionsRef,
    where('fromUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const receivedQuery = query(
    transactionsRef,
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  let allTransactions: Transaction[] = [];

  const updateTransactions = () => {
    // Sort by creation date (most recent first)
    const sorted = allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(sorted);
  };

  const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
    const sentTransactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toJsDate(data.createdAt),
      } as Transaction;
    });

    // Update allTransactions with sent transactions
    allTransactions = allTransactions.filter(t => t.fromUserId !== userId);
    allTransactions.push(...sentTransactions);
    updateTransactions();
  });

  const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
    const receivedTransactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toJsDate(data.createdAt),
      } as Transaction;
    });

    // Update allTransactions with received transactions
    allTransactions = allTransactions.filter(t => t.toUserId !== userId);
    allTransactions.push(...receivedTransactions);
    updateTransactions();
  });

  return () => {
    unsubscribeSent();
    unsubscribeReceived();
  };
};

// Cancel a transaction (refund credits)
export const cancelTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionSnap = await transaction.get(transactionRef);

      if (!transactionSnap.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionSnap.data() as Transaction;
      
      if (transactionData.status === 'cancelled') {
        throw new Error('Transaction already cancelled');
      }

      // Update transaction status
      transaction.update(transactionRef, {
        status: 'cancelled',
        updatedAt: new Date()
      });

      // Refund credits
      const fromUserRef = doc(db, 'userProfiles', transactionData.fromUserId);
      const toUserRef = doc(db, 'userProfiles', transactionData.toUserId);
      
      const fromUserSnap = await transaction.get(fromUserRef);
      const toUserSnap = await transaction.get(toUserRef);

      if (fromUserSnap.exists() && toUserSnap.exists()) {
        const fromUser = fromUserSnap.data();
        const toUser = toUserSnap.data();

        // Refund credits
        transaction.update(fromUserRef, {
          credits: fromUser.credits + transactionData.credits,
          updatedAt: new Date()
        });

        transaction.update(toUserRef, {
          credits: toUser.credits - transactionData.credits,
          updatedAt: new Date()
        });
      }

      return true;
    });

    return result;
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    return false;
  }
};
