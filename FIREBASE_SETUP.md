# Firebase Setup Guide

## Fixing auth/unauthorized-domain Error

### Step 1: Create Environment File
Create a `.env.local` file in your project root with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Step 2: Get Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon) → General tab
4. Scroll down to "Your apps" section
5. Copy the config values from your web app

### Step 3: Add Authorized Domains
1. In Firebase Console, go to Authentication → Settings
2. Click on "Authorized domains" tab
3. Add these domains:
   - `localhost`
   - `127.0.0.1`
   - `localhost:8080` (if using Vite's default port)
   - Your production domain (when ready)

### Step 4: Enable Authentication Methods
1. In Firebase Console, go to Authentication → Sign-in method
2. Enable the methods you want to use:
   - Email/Password
   - Google (recommended)

### Step 5: Test the Fix
1. Restart your development server: `npm run dev`
2. Try logging in again
3. The error should be resolved

## Common Issues:
- Make sure you're using the correct project ID
- Ensure all environment variables are properly set
- Check that the domain matches exactly (including port)
- Verify Firebase project is active and not in test mode