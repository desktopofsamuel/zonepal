'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  UserData, 
  TimelineSettings 
} from '@/lib/types';
import { 
  createUserData,
  getUserData,
  updateFavoriteTimezones,
  updateRecentTimezones,
  updateTimelineSettings,
  updateDefaultView,
  subscribeToUserData,
  migrateLocalStorageData
} from '@/lib/user-data';

// User data context interface
interface UserDataContextType {
  userData: UserData | null;
  loading: boolean;
  updateFavorites: (timezones: string[]) => Promise<void>;
  updateRecent: (timezones: string[]) => Promise<void>;
  updateSettings: (settings: TimelineSettings) => Promise<void>;
  updateView: (view: 'cards' | 'grid') => Promise<void>;
}

// Create context
const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

// User data provider component
export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize user data when user signs in
  useEffect(() => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const initializeUserData = async () => {
      try {
        // Check if user data exists
        let data = await getUserData(user.uid);
        
        if (!data) {
          // Create new user data with Google profile info
          await createUserData(
            user.uid, 
            user.email!, 
            user.displayName || undefined
          );
          data = await getUserData(user.uid);
          
          // Migrate localStorage data for new users
          await migrateLocalStorageData(user.uid);
        }

        setUserData(data);
      } catch (error) {
        console.error('Error initializing user data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUserData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserData(user.uid, (data) => {
      setUserData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Update favorite timezones
  const updateFavorites = async (timezones: string[]) => {
    if (!user) return;
    try {
      await updateFavoriteTimezones(user.uid, timezones);
    } catch (error) {
      console.error('Error updating favorites:', error);
      throw error;
    }
  };

  // Update recent timezones
  const updateRecent = async (timezones: string[]) => {
    if (!user) return;
    try {
      await updateRecentTimezones(user.uid, timezones);
    } catch (error) {
      console.error('Error updating recent timezones:', error);
      throw error;
    }
  };

  // Update timeline settings
  const updateSettings = async (settings: TimelineSettings) => {
    if (!user) return;
    try {
      await updateTimelineSettings(user.uid, settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Update default view
  const updateView = async (view: 'cards' | 'grid') => {
    if (!user) return;
    try {
      await updateDefaultView(user.uid, view);
    } catch (error) {
      console.error('Error updating view:', error);
      throw error;
    }
  };

  const value = {
    userData,
    loading,
    updateFavorites,
    updateRecent,
    updateSettings,
    updateView,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

// Hook to use user data context
export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}