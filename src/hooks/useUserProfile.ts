import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './useAuth';
import { getUserProfile, UserProfile } from '@/lib/userService';

export const useUserProfile = () => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user) {
                setLoading(true);
                try {
                    const profile = await getUserProfile(user.uid);
                    setUserProfile(profile);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setUserProfile(null);
                } finally {
                    setLoading(false);
                }
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [user]);

    return { userProfile, loading };
};
