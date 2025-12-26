export interface BlockedTimeSlot {
  start: number; // Hour in 24-hour format (0-23)
  end: number; // Hour in 24-hour format (0-23)
  ianaName?: string; // Optional: specific timezone. If not provided, applies to all
}

export interface TimelineSettings {
  blockedTimeSlots: BlockedTimeSlot[];
  defaultBlockedHours: {
    start: number;
    end: number;
  };
  referenceTimezone: string; // The timezone to use as reference for blocked hours
}

// Firebase Auth User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// User data stored in Firestore
export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
  // User preferences
  favoriteTimezones: string[]; // Array of IANA timezone names
  recentTimezones: string[]; // Recently used timezones
  timelineSettings: TimelineSettings;
  // App settings
  defaultView: 'cards' | 'grid';
  theme?: 'light' | 'dark' | 'system';
}

// Firestore document structure
export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: { toDate(): Date } | null; // Firestore Timestamp
  updatedAt: { toDate(): Date } | null; // Firestore Timestamp
  favoriteTimezones: string[];
  recentTimezones: string[];
  timelineSettings: TimelineSettings;
  defaultView: 'cards' | 'grid';
  theme?: 'light' | 'dark' | 'system';
} 