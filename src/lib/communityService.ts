import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface CommunityStats {
  activeMembers: number;
  skillsTaught: number;
  sessionsCompleted: number;
  creditsExchanged: number;
}

export interface TopProvider {
  id: string;
  name: string;
  avatar?: string;
  skills: string[];
  rating: number;
  sessions: number;
  credits: number;
  providerId: string;
}

export interface RecentActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  skillTitle?: string;
  skillId?: string;
  bookingId?: string;
  timestamp: Date;
  type: 'session_completed' | 'session_started' | 'credits_earned' | 'skill_created' | 'booking_created';
}

// Get community statistics
export const getCommunityStats = async (): Promise<CommunityStats> => {
  try {
    // Get active users (users with at least one skill or booking)
    const [skillsSnapshot, bookingsSnapshot, transactionsSnapshot] = await Promise.all([
      getDocs(collection(db, 'skills')),
      getDocs(collection(db, 'bookings')),
      getDocs(collection(db, 'transactions'))
    ]);

    // Count unique active users
    const activeUserIds = new Set<string>();
    
    // Add users who have created skills
    skillsSnapshot.docs.forEach(doc => {
      const skill = doc.data();
      if (skill.providerId) {
        activeUserIds.add(skill.providerId);
      }
    });

    // Add users who have bookings
    bookingsSnapshot.docs.forEach(doc => {
      const booking = doc.data();
      if (booking.requesterId) activeUserIds.add(booking.requesterId);
      if (booking.providerId) activeUserIds.add(booking.providerId);
    });

    // Count skills taught
    const skillsTaught = skillsSnapshot.docs.length;

    // Count completed sessions
    const completedBookings = bookingsSnapshot.docs.filter(doc => 
      doc.data().status === 'completed'
    ).length;

    // Count credits exchanged
    const creditsExchanged = transactionsSnapshot.docs.reduce((total, doc) => {
      const transaction = doc.data();
      return total + (transaction.credits || 0);
    }, 0);

    return {
      activeMembers: activeUserIds.size,
      skillsTaught,
      sessionsCompleted: completedBookings,
      creditsExchanged
    };
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return {
      activeMembers: 0,
      skillsTaught: 0,
      sessionsCompleted: 0,
      creditsExchanged: 0
    };
  }
};

// Get top providers based on sessions and ratings
export const getTopProviders = async (limitCount: number = 10): Promise<TopProvider[]> => {
  try {
    // Get all skills with their providers
    const skillsSnapshot = await getDocs(collection(db, 'skills'));
    const providerStats = new Map<string, {
      providerId: string;
      name: string;
      avatar?: string;
      skills: string[];
      totalSessions: number;
      totalCredits: number;
      ratings: number[];
      skillTitles: string[];
    }>();

    // Process skills to aggregate provider data
    skillsSnapshot.docs.forEach(doc => {
      const skill = doc.data();
      const providerId = skill.providerId;
      
      if (!providerStats.has(providerId)) {
        providerStats.set(providerId, {
          providerId,
          name: skill.providerName || 'Unknown',
          avatar: skill.providerAvatar,
          skills: [],
          totalSessions: 0,
          totalCredits: 0,
          ratings: [],
          skillTitles: []
        });
      }

      const stats = providerStats.get(providerId)!;
      stats.skills.push(skill.title);
      stats.skillTitles.push(skill.title);
      stats.totalSessions += skill.totalSessions || 0;
      stats.totalCredits += skill.creditsPerHour || 0;
      
      if (skill.rating) {
        stats.ratings.push(skill.rating);
      }
    });

    // Get booking data to calculate actual sessions and credits
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const completedBookings = bookingsSnapshot.docs.filter(doc => 
      doc.data().status === 'completed'
    );

    // Reset and recalculate with actual booking data
    providerStats.clear();
    
    skillsSnapshot.docs.forEach(doc => {
      const skill = doc.data();
      const providerId = skill.providerId;
      
      if (!providerStats.has(providerId)) {
        providerStats.set(providerId, {
          providerId,
          name: skill.providerName || 'Unknown',
          avatar: skill.providerAvatar,
          skills: [],
          totalSessions: 0,
          totalCredits: 0,
          ratings: [],
          skillTitles: []
        });
      }

      const stats = providerStats.get(providerId)!;
      stats.skills.push(skill.title);
      stats.skillTitles.push(skill.title);
      
      if (skill.rating) {
        stats.ratings.push(skill.rating);
      }
    });

    // Count actual sessions and credits from bookings
    completedBookings.forEach(doc => {
      const booking = doc.data();
      const providerId = booking.providerId;
      
      if (providerStats.has(providerId)) {
        const stats = providerStats.get(providerId)!;
        stats.totalSessions += 1;
        stats.totalCredits += booking.credits || 0;
      }
    });

    // Convert to TopProvider format and sort
    const topProviders: TopProvider[] = Array.from(providerStats.values())
      .map(stats => ({
        id: stats.providerId,
        name: stats.name,
        avatar: stats.avatar,
        skills: stats.skills.slice(0, 5), // Limit to 5 skills
        rating: stats.ratings.length > 0 
          ? stats.ratings.reduce((sum, rating) => sum + rating, 0) / stats.ratings.length 
          : 0,
        sessions: stats.totalSessions,
        credits: stats.totalCredits,
        providerId: stats.providerId
      }))
      .filter(provider => provider.sessions > 0) // Only providers with sessions
      .sort((a, b) => {
        // Sort by sessions first, then by rating
        if (b.sessions !== a.sessions) {
          return b.sessions - a.sessions;
        }
        return b.rating - a.rating;
      })
      .slice(0, limitCount);

    return topProviders;
  } catch (error) {
    console.error('Error fetching top providers:', error);
    return [];
  }
};

// Get recent activities from bookings and transactions
export const getRecentActivities = async (limitCount: number = 20): Promise<RecentActivity[]> => {
  try {
    const activities: RecentActivity[] = [];

    // Get recent bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);

    // Get recent transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);

    // Process bookings
    for (const doc of bookingsSnapshot.docs) {
      const booking = doc.data();
      
      // Get user profile for requester
      const requesterProfile = await getUserProfile(booking.requesterId);
      const providerProfile = await getUserProfile(booking.providerId);

      if (booking.status === 'completed') {
        activities.push({
          id: `booking-${doc.id}`,
          userId: booking.requesterId,
          userName: requesterProfile?.displayName || requesterProfile?.email || 'User',
          userAvatar: requesterProfile?.photoURL,
          action: 'completed a session',
          skillTitle: booking.skillTitle,
          skillId: booking.skillId,
          bookingId: doc.id,
          timestamp: booking.createdAt?.toDate() || new Date(),
          type: 'session_completed'
        });
      } else if (booking.status === 'confirmed') {
        activities.push({
          id: `booking-${doc.id}`,
          userId: booking.requesterId,
          userName: requesterProfile?.displayName || requesterProfile?.email || 'User',
          userAvatar: requesterProfile?.photoURL,
          action: 'started learning',
          skillTitle: booking.skillTitle,
          skillId: booking.skillId,
          bookingId: doc.id,
          timestamp: booking.createdAt?.toDate() || new Date(),
          type: 'session_started'
        });
      }
    }

    // Process transactions
    for (const doc of transactionsSnapshot.docs) {
      const transaction = doc.data();
      
      if (transaction.type === 'earned') {
        const userProfile = await getUserProfile(transaction.toUserId);
        
        activities.push({
          id: `transaction-${doc.id}`,
          userId: transaction.toUserId,
          userName: userProfile?.displayName || userProfile?.email || 'User',
          userAvatar: userProfile?.photoURL,
          action: `earned ${transaction.credits} credits teaching`,
          skillTitle: transaction.description,
          timestamp: transaction.createdAt?.toDate() || new Date(),
          type: 'credits_earned'
        });
      }
    }

    // Sort all activities by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limitCount);

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

// Helper function to get user profile
const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'userProfiles', userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Real-time community stats listener
export const subscribeToCommunityStats = (
  callback: (stats: CommunityStats) => void
) => {
  // Since stats are calculated from multiple collections,
  // we'll use a simple polling approach for now
  const updateStats = async () => {
    const stats = await getCommunityStats();
    callback(stats);
  };

  // Initial load
  updateStats();

  // Update every 30 seconds
  const interval = setInterval(updateStats, 30000);

  // Return cleanup function
  return () => clearInterval(interval);
};

// Real-time top providers listener
export const subscribeToTopProviders = (
  callback: (providers: TopProvider[]) => void,
  limitCount: number = 10
) => {
  const updateProviders = async () => {
    const providers = await getTopProviders(limitCount);
    callback(providers);
  };

  // Initial load
  updateProviders();

  // Update every 60 seconds
  const interval = setInterval(updateProviders, 60000);

  return () => clearInterval(interval);
};

// Real-time recent activities listener
export const subscribeToRecentActivities = (
  callback: (activities: RecentActivity[]) => void,
  limitCount: number = 20
) => {
  const updateActivities = async () => {
    const activities = await getRecentActivities(limitCount);
    callback(activities);
  };

  // Initial load
  updateActivities();

  // Update every 30 seconds
  const interval = setInterval(updateActivities, 30000);

  return () => clearInterval(interval);
};

// Search community members and skills
export const searchCommunity = async (
  query: string,
  limitCount: number = 20
): Promise<{
  providers: TopProvider[];
  skills: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    providerName: string;
    providerId: string;
    rating: number;
    creditsPerHour: number;
  }>;
}> => {
  try {
    if (!query.trim()) {
      return { providers: [], skills: [] };
    }

    const searchTerm = query.toLowerCase().trim();

    // Search skills
    const skillsSnapshot = await getDocs(collection(db, 'skills'));
    const matchingSkills = skillsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(skill => 
        skill.title.toLowerCase().includes(searchTerm) ||
        skill.description.toLowerCase().includes(searchTerm) ||
        skill.category.toLowerCase().includes(searchTerm) ||
        skill.providerName.toLowerCase().includes(searchTerm)
      )
      .slice(0, limitCount);

    // Get unique providers from matching skills
    const providerIds = [...new Set(matchingSkills.map(skill => skill.providerId))];
    const providers = await Promise.all(
      providerIds.map(async (providerId) => {
        const providerSkills = matchingSkills.filter(skill => skill.providerId === providerId);
        const totalSessions = providerSkills.reduce((sum, skill) => sum + (skill.totalSessions || 0), 0);
        const totalCredits = providerSkills.reduce((sum, skill) => sum + (skill.creditsPerHour || 0), 0);
        const ratings = providerSkills.filter(skill => skill.rating).map(skill => skill.rating);
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

        return {
          id: providerId,
          name: providerSkills[0]?.providerName || 'Unknown',
          avatar: providerSkills[0]?.providerAvatar,
          skills: providerSkills.map(skill => skill.title),
          rating: avgRating,
          sessions: totalSessions,
          credits: totalCredits,
          providerId
        };
      })
    );

    return {
      providers: providers.sort((a, b) => b.sessions - a.sessions),
      skills: matchingSkills.map(skill => ({
        id: skill.id,
        title: skill.title,
        description: skill.description,
        category: skill.category,
        providerName: skill.providerName,
        providerId: skill.providerId,
        rating: skill.rating || 0,
        creditsPerHour: skill.creditsPerHour
      }))
    };
  } catch (error) {
    console.error('Error searching community:', error);
    return { providers: [], skills: [] };
  }
};
