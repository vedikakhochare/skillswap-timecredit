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
    onSnapshot,
    Timestamp,
    serverTimestamp
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

export interface Message {
    id?: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'system';
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Conversation {
    id?: string;
    participants: string[]; // Array of user IDs
    lastMessage?: Message;
    lastMessageAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Additional metadata
    skillId?: string; // If conversation is related to a skill
    bookingId?: string; // If conversation is related to a booking
}

export interface ConversationWithParticipants {
    conversation: Conversation;
    participants: {
        id: string;
        name: string;
        avatar?: string;
    }[];
    unreadCount: number;
}

// Create a new conversation
export const createConversation = async (
    participantIds: string[],
    metadata?: { skillId?: string; bookingId?: string }
): Promise<string> => {
    const conversation: Omit<Conversation, 'id'> = {
        participants: participantIds,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...metadata
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversation);
    return docRef.id;
};

// Get or create conversation between two users
export const getOrCreateConversation = async (
    userId1: string,
    userId2: string,
    metadata?: { skillId?: string; bookingId?: string }
): Promise<string> => {
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId1),
        where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
        const conversation = doc.data() as Conversation;
        if (conversation.participants.includes(userId2)) {
            return doc.id;
        }
    }

    // Create new conversation if none exists
    return await createConversation([userId1, userId2], metadata);
};

// Send a message
export const sendMessage = async (
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    type: Message['type'] = 'text'
): Promise<string> => {
    const message: Omit<Message, 'id'> = {
        conversationId,
        senderId,
        receiverId,
        content,
        type,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'messages'), message);

    // Update conversation with last message info
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return docRef.id;
};

// Get messages for a conversation
export const getMessages = async (
    conversationId: string,
    limitCount: number = 50
): Promise<Message[]> => {
    const messagesRef = collection(db, 'messages');
    const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toJsDate(doc.data().createdAt),
        updatedAt: toJsDate(doc.data().updatedAt)
    } as Message)).reverse(); // Reverse to show oldest first
};

// Get conversations for a user
export const getUserConversations = async (userId: string): Promise<ConversationWithParticipants[]> => {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        where('isActive', '==', true),
        orderBy('lastMessageAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const conversations: ConversationWithParticipants[] = [];

    for (const doc of querySnapshot.docs) {
        const conversation = {
            id: doc.id,
            ...doc.data(),
            createdAt: toJsDate(doc.data().createdAt),
            updatedAt: toJsDate(doc.data().updatedAt),
            lastMessageAt: doc.data().lastMessageAt ? toJsDate(doc.data().lastMessageAt) : undefined
        } as Conversation;

        // Get participant details
        const participants = [];
        for (const participantId of conversation.participants) {
            if (participantId !== userId) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', participantId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        participants.push({
                            id: participantId,
                            name: userData.displayName || 'Unknown User',
                            avatar: userData.photoURL
                        });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        }

        // Get unread count
        const unreadMessagesRef = collection(db, 'messages');
        const unreadQuery = query(
            unreadMessagesRef,
            where('conversationId', '==', conversation.id),
            where('receiverId', '==', userId),
            where('isRead', '==', false)
        );
        const unreadSnapshot = await getDocs(unreadQuery);
        const unreadCount = unreadSnapshot.size;

        conversations.push({
            conversation,
            participants,
            unreadCount
        });
    }

    return conversations;
};

// Mark messages as read
export const markMessagesAsRead = async (
    conversationId: string,
    userId: string
): Promise<void> => {
    const messagesRef = collection(db, 'messages');
    const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('receiverId', '==', userId),
        where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updatePromises);
};

// Get conversation by ID
export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    
    if (conversationDoc.exists()) {
        return {
            id: conversationDoc.id,
            ...conversationDoc.data(),
            createdAt: toJsDate(conversationDoc.data().createdAt),
            updatedAt: toJsDate(conversationDoc.data().updatedAt),
            lastMessageAt: conversationDoc.data().lastMessageAt ? toJsDate(conversationDoc.data().lastMessageAt) : undefined
        } as Conversation;
    }

    return null;
};

// Real-time message listener
export const subscribeToMessages = (
    conversationId: string,
    callback: (messages: Message[]) => void
) => {
    const messagesRef = collection(db, 'messages');
    const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: toJsDate(doc.data().createdAt),
            updatedAt: toJsDate(doc.data().updatedAt)
        } as Message));
        callback(messages);
    });
};

// Real-time conversation listener
export const subscribeToUserConversations = (
    userId: string,
    callback: (conversations: ConversationWithParticipants[]) => void
) => {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        where('isActive', '==', true),
        orderBy('lastMessageAt', 'desc')
    );

    return onSnapshot(q, async (querySnapshot) => {
        const conversations: ConversationWithParticipants[] = [];

        for (const doc of querySnapshot.docs) {
            const conversation = {
                id: doc.id,
                ...doc.data(),
                createdAt: toJsDate(doc.data().createdAt),
                updatedAt: toJsDate(doc.data().updatedAt),
                lastMessageAt: doc.data().lastMessageAt ? toJsDate(doc.data().lastMessageAt) : undefined
            } as Conversation;

            // Get participant details
            const participants = [];
            for (const participantId of conversation.participants) {
                if (participantId !== userId) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', participantId));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            participants.push({
                                id: participantId,
                                name: userData.displayName || 'Unknown User',
                                avatar: userData.photoURL
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                    }
                }
            }

            // Get unread count
            const unreadMessagesRef = collection(db, 'messages');
            const unreadQuery = query(
                unreadMessagesRef,
                where('conversationId', '==', conversation.id),
                where('receiverId', '==', userId),
                where('isRead', '==', false)
            );
            const unreadSnapshot = await getDocs(unreadQuery);
            const unreadCount = unreadSnapshot.size;

            conversations.push({
                conversation,
                participants,
                unreadCount
            });
        }

        callback(conversations);
    });
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
    await deleteDoc(doc(db, 'messages', messageId));
};

// Archive a conversation
export const archiveConversation = async (conversationId: string): Promise<void> => {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
        isActive: false,
        updatedAt: serverTimestamp()
    });
};
