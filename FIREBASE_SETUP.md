# Firebase Setup Guide

## 1. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing project or create a new one
3. Enable the following services:

### Authentication Setup
1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Configure any additional providers if needed


### Firestore Database Setup
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location
5. Create the database

### Security Rules (Optional - for production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 2. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** and select **Web** (</>) 
4. Register your app (name it something like "ZonePal Web")
5. Copy the configuration object

## 3. Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Firebase configuration values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 4. Test the Setup

1. Start your development server: `yarn dev`
2. Navigate to your app
3. Click the "Sign In" button in the top right
4. Try creating a new account
5. Check the Firebase Console to see if the user was created

## 5. Firestore Collections

The app will automatically create the following collections:

- **users**: Stores user preferences and settings
  - Document ID: User's UID
  - Fields: email, favoriteTimezones, recentTimezones, timelineSettings, etc.

## Features Implemented

✅ **User Authentication**
- Email/password sign up and sign in
- User profile management
- Secure logout

✅ **Data Persistence**
- Timeline settings (blocked hours)
- Recent timezones
- Favorite timezones (ready for future implementation)
- View preferences (cards/grid)

✅ **Real-time Sync**
- Settings sync across devices
- Automatic data backup
- Offline tolerance with local state

✅ **Migration Support**
- Automatic migration from localStorage
- Preserves existing user preferences

## Troubleshooting

**"Firebase not configured" error**: Make sure all environment variables are set correctly in `.env.local`

**Authentication errors**: Check that Email/Password provider is enabled in Firebase Console

**Firestore permission errors**: Ensure Firestore is created and rules allow authenticated users to read/write their own data