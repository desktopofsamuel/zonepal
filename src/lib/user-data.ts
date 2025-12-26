import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserData, UserDocument, TimelineSettings } from '@/lib/types';

// Collection name for user data
const USERS_COLLECTION = 'users';

// Create initial user data document
export async function createUserData(uid: string, email: string, displayName?: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  
  const defaultTimelineSettings: TimelineSettings = {
    blockedTimeSlots: [{ start: 22, end: 6 }],
    defaultBlockedHours: { start: 22, end: 6 },
    referenceTimezone: 'UTC'
  };

  const userData: Omit<UserDocument, 'createdAt' | 'updatedAt'> = {
    uid,
    email,
    displayName,
    favoriteTimezones: [],
    recentTimezones: [],
    timelineSettings: defaultTimelineSettings,
    defaultView: 'cards',
  };

  try {
    const now = Timestamp.now();
    await setDoc(userRef, {
      ...userData,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error creating user data:', error);
    throw error;
  }
}

// Get user data from Firestore
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data() as UserDocument;
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

// Update user's favorite timezones
export async function updateFavoriteTimezones(uid: string, timezones: string[]): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      favoriteTimezones: timezones,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating favorite timezones:', error);
    throw error;
  }
}

// Update user's recent timezones
export async function updateRecentTimezones(uid: string, timezones: string[]): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      recentTimezones: timezones,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating recent timezones:', error);
    throw error;
  }
}

// Update user's timeline settings (blocked hours)
export async function updateTimelineSettings(uid: string, settings: TimelineSettings): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      timelineSettings: settings,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating timeline settings:', error);
    throw error;
  }
}

// Update user's default view preference
export async function updateDefaultView(uid: string, view: 'cards' | 'grid'): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      defaultView: view,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating default view:', error);
    throw error;
  }
}

// Subscribe to real-time user data updates
export function subscribeToUserData(
  uid: string, 
  callback: (userData: UserData | null) => void
): Unsubscribe {
  const userRef = doc(db, USERS_COLLECTION, uid);
  
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data() as UserDocument;
      const userData: UserData = {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
      callback(userData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to user data:', error);
    callback(null);
  });
}

// Migrate data from localStorage to Firestore
export async function migrateLocalStorageData(uid: string): Promise<void> {
  try {
    // Check if user data already exists
    const existingData = await getUserData(uid);
    if (existingData) {
      // User data already exists, don't overwrite
      return;
    }

    // Get recent timezones from localStorage
    const recentTimezones = JSON.parse(localStorage.getItem('recentTimezones') || '[]');
    
    // Get any existing settings from URL or localStorage
    // You might want to extend this based on your current localStorage usage
    
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      recentTimezones: recentTimezones.slice(0, 10), // Limit to 10 recent timezones
      updatedAt: Timestamp.now(),
    });

    // Optionally clear localStorage after migration
    // localStorage.removeItem('recentTimezones');
    
  } catch (error) {
    console.error('Error migrating localStorage data:', error);
    // Don't throw error to avoid blocking user experience
  }
}