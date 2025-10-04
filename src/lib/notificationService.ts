import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id?: string;
  userId: string;
  type: 'feedback_reminder' | 'session_reminder' | 'session_confirmed' | 'session_completed' | 'new_message' | 'credit_earned';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  feedbackReminders: boolean;
  sessionReminders: boolean;
  messageNotifications: boolean;
  creditNotifications: boolean;
}

// Create a notification
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const notificationData = {
      ...notification,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId: string, limitCount: number = 50): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      readAt: doc.data().readAt?.toDate() || undefined
    } as Notification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    isRead: true,
    readAt: serverTimestamp()
  });
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const notifications = await getUserNotifications(userId, 1000);
  const unreadNotifications = notifications.filter(n => !n.isRead);
  
  const updatePromises = unreadNotifications.map(notification => 
    markNotificationAsRead(notification.id!)
  );
  
  await Promise.all(updatePromises);
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const notifications = await getUserNotifications(userId, 1000);
    return notifications.filter(n => !n.isRead).length;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};

// Create feedback reminder notification
export const createFeedbackReminderNotification = async (
  userId: string,
  bookingId: string,
  skillTitle: string,
  providerName: string
): Promise<string> => {
  return await createNotification({
    userId,
    type: 'feedback_reminder',
    title: 'Session Feedback Reminder',
    message: `How was your session with ${providerName}? Please leave feedback for "${skillTitle}".`,
    data: {
      bookingId,
      skillTitle,
      providerName,
      actionUrl: `/dashboard?feedback=${bookingId}`
    },
    isRead: false
  });
};

// Create session reminder notification
export const createSessionReminderNotification = async (
  userId: string,
  bookingId: string,
  skillTitle: string,
  sessionDate: Date,
  sessionTime: string
): Promise<string> => {
  const timeUntilSession = sessionDate.getTime() - Date.now();
  const hoursUntilSession = Math.floor(timeUntilSession / (1000 * 60 * 60));
  
  let reminderMessage = '';
  if (hoursUntilSession <= 1) {
    reminderMessage = `Your session "${skillTitle}" starts in less than 1 hour!`;
  } else if (hoursUntilSession <= 24) {
    reminderMessage = `Your session "${skillTitle}" is tomorrow at ${sessionTime}`;
  } else {
    reminderMessage = `Your session "${skillTitle}" is coming up on ${sessionDate.toLocaleDateString()} at ${sessionTime}`;
  }

  return await createNotification({
    userId,
    type: 'session_reminder',
    title: 'Upcoming Session',
    message: reminderMessage,
    data: {
      bookingId,
      skillTitle,
      sessionDate: sessionDate.toISOString(),
      sessionTime,
      actionUrl: `/dashboard?session=${bookingId}`
    },
    isRead: false
  });
};

// Create session confirmed notification
export const createSessionConfirmedNotification = async (
  userId: string,
  bookingId: string,
  skillTitle: string,
  providerName: string,
  sessionDate: Date,
  sessionTime: string
): Promise<string> => {
  return await createNotification({
    userId,
    type: 'session_confirmed',
    title: 'Session Confirmed! 🎉',
    message: `Your session "${skillTitle}" with ${providerName} has been confirmed for ${sessionDate.toLocaleDateString()} at ${sessionTime}`,
    data: {
      bookingId,
      skillTitle,
      providerName,
      sessionDate: sessionDate.toISOString(),
      sessionTime,
      actionUrl: `/dashboard?session=${bookingId}`
    },
    isRead: false
  });
};

// Create session completed notification
export const createSessionCompletedNotification = async (
  userId: string,
  bookingId: string,
  skillTitle: string,
  providerName: string,
  creditsEarned: number
): Promise<string> => {
  return await createNotification({
    userId,
    type: 'session_completed',
    title: 'Session Completed! 🎉',
    message: `Great job! You've completed your session "${skillTitle}" with ${providerName} and earned ${creditsEarned} credits.`,
    data: {
      bookingId,
      skillTitle,
      providerName,
      creditsEarned,
      actionUrl: `/dashboard?feedback=${bookingId}`
    },
    isRead: false
  });
};

// Create new message notification
export const createNewMessageNotification = async (
  userId: string,
  senderName: string,
  conversationId: string,
  messagePreview: string
): Promise<string> => {
  return await createNotification({
    userId,
    type: 'new_message',
    title: `New message from ${senderName}`,
    message: messagePreview.length > 50 ? `${messagePreview.substring(0, 50)}...` : messagePreview,
    data: {
      conversationId,
      senderName,
      actionUrl: `/messages?conversation=${conversationId}`
    },
    isRead: false
  });
};

// Create credit earned notification
export const createCreditEarnedNotification = async (
  userId: string,
  creditsEarned: number,
  skillTitle: string,
  providerName: string
): Promise<string> => {
  return await createNotification({
    userId,
    type: 'credit_earned',
    title: 'Credits Earned! 💰',
    message: `You earned ${creditsEarned} credits for teaching "${skillTitle}" to ${providerName}`,
    data: {
      creditsEarned,
      skillTitle,
      providerName,
      actionUrl: '/dashboard'
    },
    isRead: false
  });
};

// Schedule feedback reminder (to be called after session completion)
export const scheduleFeedbackReminder = async (
  userId: string,
  bookingId: string,
  skillTitle: string,
  providerName: string,
  delayHours: number = 24
): Promise<void> => {
  // In a real implementation, you might use a job queue or scheduled function
  // For now, we'll create the notification immediately
  setTimeout(async () => {
    await createFeedbackReminderNotification(userId, bookingId, skillTitle, providerName);
  }, delayHours * 60 * 60 * 1000);
};

// Schedule session reminder (to be called when booking is confirmed)
export const scheduleSessionReminder = async (
  userId: string,
  bookingId: string,
  skillTitle: string,
  sessionDate: Date,
  sessionTime: string,
  reminderHours: number = 24
): Promise<void> => {
  const reminderTime = new Date(sessionDate.getTime() - (reminderHours * 60 * 60 * 1000));
  const delayMs = reminderTime.getTime() - Date.now();
  
  if (delayMs > 0) {
    setTimeout(async () => {
      await createSessionReminderNotification(userId, bookingId, skillTitle, sessionDate, sessionTime);
    }, delayMs);
  }
};
