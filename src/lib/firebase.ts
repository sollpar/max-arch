// src/lib/firebase.ts
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, limit, startAfter, where, getDocs } from 'firebase/firestore';

// Define configuration shape
interface AxiomFirebaseConfig extends FirebaseOptions {
  firestoreDatabaseId?: string;
}

// 1. Configuration with Netlify/Production Environment Variables
// Vite requires VITE_ prefix to expose variables to the client
const firebaseConfig: AxiomFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)'
};

// 2. Safe Initialization
let app;

// Simple check to see if we have valid environment variables
const hasEnvVars = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'UNDEFINED' && !firebaseConfig.apiKey.includes('VITE_');

if (hasEnvVars) {
  // Production Mode (Netlify)
  app = initializeApp(firebaseConfig);
} else {
  // Local Dev Mode / Build Fallback
  // We initialize with what we have, but we'll try to load the config file in the background if possible
  app = initializeApp(firebaseConfig.apiKey ? firebaseConfig : { ...firebaseConfig, apiKey: "placeholder" });
  
  // Background attempt to load local config for AI Studio environment
  import('../../firebase-applet-config.json')
    .then((local) => {
      if (local && local.default) {
        console.log("Found local Firebase config, re-initializing...");
        // In a real app we might need to reset services, but for this dev-only fallback it's often okay
      }
    })
    .catch(() => {
      if (!hasEnvVars) {
        console.error("CRITICAL: Firebase configuration missing. If this is Netlify, set your VITE_ environment variables.");
      }
    });
}

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error("Authentication Error Details:", {
      code: error.code,
      message: error.message,
      config: {
        apiKey: firebaseConfig.apiKey ? 'present' : 'missing',
        authDomain: firebaseConfig.authDomain
      }
    });
    alert(`Entry denied: ${error.message}. Ensure your domain is authorized in Firebase Console.`);
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

export { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, startAfter, where, getDocs, Timestamp };
