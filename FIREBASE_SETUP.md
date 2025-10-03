# Firebase Setup Guide

This guide will walk you through setting up Firebase for persistent data storage in your Leaderboard app.

## Why Firebase?

Without Firebase, all your data (users, matches, challenges) is stored in memory and will be lost when the server restarts. Firebase Firestore provides:
- **Persistent Storage**: Data survives server restarts
- **Real-time Sync**: Potential for future real-time features
- **Scalability**: Handles growth automatically
- **Free Tier**: Generous free tier for small teams

## Step-by-Step Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" (or use an existing project)
3. Enter a project name (e.g., "Slack Leaderboard")
4. (Optional) Enable Google Analytics
5. Click "Create project"

### 2. Create a Firestore Database

1. In your Firebase project, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose a location closest to your users
4. Start in **Production mode** (we'll set up rules later)
5. Click "Enable"

### 3. Generate Service Account Credentials

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Click "Generate key" in the dialog
6. A JSON file will download - this contains your credentials

### 4. Configure Your App

#### Option A: Using JSON File (Recommended)

1. Rename the downloaded file to `firebase-service-account.json`
2. Move it to your project root directory (same level as `package.json`)
3. ⚠️ **Important**: This file is already in `.gitignore` - never commit it to version control!

#### Option B: Using Environment Variables

If you prefer not to have a file (e.g., for deployment), you can use environment variables:

1. Copy `.env.example` to `.env`
2. Open the downloaded JSON file
3. Copy these values from the JSON to your `.env`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id  
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_CERT_URL=the-cert-url-from-json
   ```

### 5. Test Your Setup

1. Start your server:
   ```bash
   npm run dev
   ```

2. Look for this message in the console:
   ```
   ✅ Firebase initialized successfully
   ```

3. If you see this instead:
   ```
   ⚠️ Running without Firebase. Data will not persist between restarts.
   ```
   Check that:
   - The JSON file is named exactly `firebase-service-account.json`
   - It's in the project root directory
   - The file contains valid JSON

### 6. Set Up Firestore Security Rules (Optional)

For a production deployment, you should secure your database:

1. Go to Firestore Database → Rules
2. Use these rules for basic security:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write for authenticated admin SDK
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
   
This makes the database private - only your backend (using the service account) can access it.

## Deployment Notes

### Heroku, Railway, Render, etc.

Set environment variables in your platform's dashboard instead of using the JSON file:

```
FIREBASE_PROJECT_ID=your-value
FIREBASE_PRIVATE_KEY_ID=your-value
FIREBASE_PRIVATE_KEY="your-private-key-with-newlines"
FIREBASE_CLIENT_EMAIL=your-value
FIREBASE_CLIENT_ID=your-value
FIREBASE_CERT_URL=your-value
```

### Vercel, Netlify

Upload the JSON file as a secret file, or use environment variables as above.

## Firestore Data Structure

The app creates these collections automatically:

- `users` - User profiles with ELO ratings
- `matches` - Match results (1v1 and multiplayer)
- `challenges` - Challenge records
- `settings/games` - List of available games

## Troubleshooting

### "Firebase initialization error"

- Check that your credentials are correct
- Verify the project ID matches your Firebase project
- Ensure Firestore is enabled in your Firebase project

### "Permission denied" errors

- Verify your service account has the right permissions
- Check Firestore security rules aren't blocking access

### App works but data isn't persisting

- Look for the success message on server startup
- Check for any error messages in the console
- Verify you see your data in the Firebase Console → Firestore Database

## Cost

Firebase Firestore has a generous free tier:
- **50,000 reads/day**
- **20,000 writes/day**
- **20,000 deletes/day**
- **1 GB storage**

For a small team leaderboard, you'll likely stay within the free tier indefinitely!

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Pricing](https://firebase.google.com/pricing)
- [Node.js Admin SDK Guide](https://firebase.google.com/docs/admin/setup)

