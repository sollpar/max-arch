// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp, 
  limit, 
  startAfter, 
  where, 
  getDocs,
  doc,
  getDocFromServer
} from 'firebase/firestore';

// Firebase Configuration
// Environment variables are preferred for production deployments (Cloudflare/Netlify)
// Hardcoded fallbacks ensure the AI Studio preview remains functional without manual setup
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyClfIBEluPgHbaANDkdlYxaQIaEnALUtyg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0316692566.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0316692566',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0316692566.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '693219157184',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:693219157184:web:9f31d41f8d23e17c10b925',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'ai-studio-6188f3e0-e07c-40a3-bfce-58d5070cf695'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const googleProvider = new GoogleAuthProvider();

// Connection Test (CRITICAL for debugging deployment/provisioning issues)
async function testConnection() {
  try {
    // Only perform the test once
    await getDocFromServer(doc(db, '_internal_', 'connection_test'));
    console.log("Firestore connection verified.");
  } catch (error: any) {
    console.warn("Firestore connectivity warning:", error.message);
    if (error.message.includes('unavailable') || error.message.includes('offline')) {
      console.error("Please verify that your Firestore database is provisioned and accessible.");
    }
  }
}

// Initial connection test
if (typeof window !== 'undefined') {
  testConnection();
}

export const signIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error("Authentication Error:", error.code, error.message);
    alert(`Authentication failure: ${error.message}`);
    throw error;
  }
};

export const logOut = () => signOut(auth);

export interface Achievement {
  id?: string;
  text: string;
  timestamp: Timestamp;
  type: 'work' | 'personal' | 'growth' | 'other';
  userId: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { collection, addDoc, updateDoc, query, orderBy, onSnapshot, serverTimestamp, limit, startAfter, where, getDocs, Timestamp, doc };
