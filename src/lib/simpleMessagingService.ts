import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';

export interface SimpleMessage {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface SimpleConversation {
  id?: string;
  participants: string[];
  participantNames?: { [userId: string]: string };
  participantAvatars?: { [userId: string]: string };
  lastMessage?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt: Date;
  // Booking context
  bookingId?: string;
  skillId?: string;
  skillTitle?: string;
}

// Create a simple conversation
export const createSimpleConversation = async (
  participantIds: string[],
  context?: {
    bookingId?: string;
    skillId?: string;
    skillTitle?: string;
    participantNames?: { [userId: string]: string };
    participantAvatars?: { [userId: string]: string };
  }
): Promise<string> => {
  const conversation = {
    participants: participantIds,
    participantNames: context?.participantNames || {},
    participantAvatars: context?.participantAvatars || {},
    bookingId: context?.bookingId,
    skillId: context?.skillId,
    skillTitle: context?.skillTitle,
    isActive: true,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'simple_conversations'), conversation);
  return docRef.id;
};

// Get or create conversation between two users
export const getOrCreateSimpleConversation = async (
  userId1: string,
  userId2: string,
  context?: {
    bookingId?: string;
    skillId?: string;
    skillTitle?: string;
    participantNames?: { [userId: string]: string };
    participantAvatars?: { [userId: string]: string };
  }
): Promise<string> => {
  // Check if conversation already exists
  const conversationsRef = collection(db, 'simple_conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId1),
    where('isActive', '==', true)
  );
  
  const querySnapshot = await getDocs(q);
  
  for (const doc of querySnapshot.docs) {
    const conversation = doc.data() as SimpleConversation;
    if (conversation.participants.includes(userId2)) {
      // Update conversation with new context if provided
      if (context && (context.bookingId || context.skillId)) {
        await updateDoc(doc.ref, {
          bookingId: context.bookingId,
          skillId: context.skillId,
          skillTitle: context.skillTitle,
          participantNames: { ...conversation.participantNames, ...context.participantNames },
          participantAvatars: { ...conversation.participantAvatars, ...context.participantAvatars }
        });
      }
      return doc.id;
    }
  }

  // Create new conversation if none exists
  return await createSimpleConversation([userId1, userId2], context);
};

// Send a simple message
export const sendSimpleMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string
): Promise<string> => {
  const message = {
    conversationId,
    senderId,
    receiverId,
    content,
    isRead: false,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'simple_messages'), message);

  // Update conversation with last message
  const conversationRef = doc(db, 'simple_conversations', conversationId);
  await updateDoc(conversationRef, {
    lastMessage: content,
    lastMessageAt: serverTimestamp()
  });

  return docRef.id;
};

// Get messages for a conversation
export const getSimpleMessages = async (
  conversationId: string
): Promise<SimpleMessage[]> => {
  const messagesRef = collection(db, 'simple_messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId)
  );

  const querySnapshot = await getDocs(q);
  const messages = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  } as SimpleMessage));
  
  // Sort messages by createdAt on the client side
  return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

// Get conversations for a user
export const getUserSimpleConversations = async (userId: string): Promise<SimpleConversation[]> => {
  const conversationsRef = collection(db, 'simple_conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    where('isActive', '==', true)
  );

  const querySnapshot = await getDocs(q);
  const conversations = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    lastMessageAt: doc.data().lastMessageAt?.toDate() || undefined
  } as SimpleConversation));
  
  // Sort conversations by lastMessageAt on the client side
  return conversations.sort((a, b) => {
    const aTime = a.lastMessageAt?.getTime() || a.createdAt.getTime();
    const bTime = b.lastMessageAt?.getTime() || b.createdAt.getTime();
    return bTime - aTime; // Descending order
  });
};

// Real-time message listener
export const subscribeToSimpleMessages = (
  conversationId: string,
  callback: (messages: SimpleMessage[]) => void
) => {
  const messagesRef = collection(db, 'simple_messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    } as SimpleMessage));
    
    // Sort messages by createdAt on the client side
    const sortedMessages = messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    callback(sortedMessages);
  });
};

// Real-time conversation listener
export const subscribeToUserSimpleConversations = (
  userId: string,
  callback: (conversations: SimpleConversation[]) => void
) => {
  const conversationsRef = collection(db, 'simple_conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    where('isActive', '==', true)
  );

  return onSnapshot(q, (querySnapshot) => {
    const conversations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      lastMessageAt: doc.data().lastMessageAt?.toDate() || undefined
    } as SimpleConversation));
    
    // Sort conversations by lastMessageAt on the client side
    const sortedConversations = conversations.sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() || a.createdAt.getTime();
      const bTime = b.lastMessageAt?.getTime() || b.createdAt.getTime();
      return bTime - aTime; // Descending order
    });
    callback(sortedConversations);
  });
};
