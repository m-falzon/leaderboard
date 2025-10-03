import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

export function initializeFirebase() {
  try {
    // Try to load service account from file
    const serviceAccountPath = join(__dirname, '../firebase-service-account.json');
    let serviceAccount;
    
    try {
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    } catch (error) {
      console.log('Firebase service account file not found, using environment variables...');
      
      // Fallback to environment variables
      if (!process.env.FIREBASE_PROJECT_ID) {
        throw new Error('Firebase credentials not configured. Please see README for setup instructions.');
      }
      
      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CERT_URL
      };
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    console.log('✅ Firebase initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.log('\n⚠️  Running without Firebase. Data will not persist between restarts.');
    console.log('To enable Firebase, see the README for setup instructions.\n');
    return null;
  }
}

export function getDb() {
  return db;
}

// Collection helpers
export const collections = {
  users: () => db?.collection('users'),
  matches: () => db?.collection('matches'),
  challenges: () => db?.collection('challenges'),
  games: () => db?.collection('games')
};

// Helper functions for common operations
export async function getAllUsers() {
  if (!db) return [];
  const snapshot = await collections.users().get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUserById(id) {
  if (!db) return null;
  const doc = await collections.users().doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function createUser(user) {
  if (!db) return user;
  // Use the id from the user object as the document ID
  await db.collection('users').doc(user.id).set(user);
  return user;
}

export async function updateUser(id, updates) {
  if (!db) return;
  try {
    console.log('Firebase updateUser called with:', { id, updates });
    const docRef = db.collection('users').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('Document does not exist, using set instead');
      // Document doesn't exist, use set with merge
      await docRef.set(updates, { merge: true });
    } else {
      console.log('Document exists, using update');
      await docRef.update(updates);
    }
    console.log('Firebase update completed successfully');
  } catch (error) {
    console.error('Firebase updateUser error:', error);
    throw error;
  }
}

export async function getAllMatches() {
  if (!db) return [];
  const snapshot = await collections.matches().orderBy('date', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createMatch(match) {
  if (!db) return match;
  const docRef = await collections.matches().add(match);
  return { id: docRef.id, ...match };
}

export async function getAllChallenges() {
  if (!db) return [];
  const snapshot = await collections.challenges().orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getChallengeById(id) {
  if (!db) return null;
  const doc = await collections.challenges().doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function createChallenge(challenge) {
  if (!db) return challenge;
  const docRef = await collections.challenges().add(challenge);
  return { id: docRef.id, ...challenge };
}

export async function updateChallenge(id, updates) {
  if (!db) return;
  await collections.challenges().doc(id).update(updates);
}

export async function deleteChallenge(id) {
  if (!db) return;
  await collections.challenges().doc(id).delete();
}

export async function getGames() {
  if (!db) return ['Chess', 'Ping Pong', 'Pool', 'Foosball', 'Street Fighter', 'Mario Kart'];
  
  const doc = await db.collection('settings').doc('games').get();
  if (doc.exists) {
    return doc.data().list || [];
  }
  
  // Initialize with default games
  const defaultGames = ['Chess', 'Ping Pong', 'Pool', 'Foosball', 'Street Fighter', 'Mario Kart'];
  await db.collection('settings').doc('games').set({ list: defaultGames });
  return defaultGames;
}

export async function addGame(gameName) {
  if (!db) return;
  
  const games = await getGames();
  if (!games.includes(gameName)) {
    games.push(gameName);
    await db.collection('settings').doc('games').set({ list: games });
  }
}

export async function deleteGame(gameName) {
  if (!db) return;
  
  const games = await getGames();
  const updatedGames = games.filter(g => g !== gameName);
  await db.collection('settings').doc('games').set({ list: updatedGames });
}

