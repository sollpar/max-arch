// src/lib/firebase.ts
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, limit, startAfter, where, getDocs } from 'firebase/firestore';

// Define configuration shape
interface AxiomFirebaseConfig extends FirebaseOptions {
  firestoreDatabaseId?: string;
}

// 1. Configuration with Netlify/Production Environment Variables
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
const isDev = !firebaseConfig.apiKey || firebaseConfig.apiKey === 'UNDEFINED';

if (!isDev) {
  app = initializeApp(firebaseConfig);
} else {
  // In AI Studio Dev Mode, we initialize with a dummy and rely on local config
  // In reality, AI Studio will have the environment set up, but this protects the GitHub/Production build
  app = initializeApp(firebaseConfig.apiKey ? firebaseConfig : { apiKey: "dev-placeholder", ...firebaseConfig });
}

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Background check for local config (for AI Studio development)
if (!firebaseConfig.apiKey) {
  import('../../firebase-applet-config.json')
    .then((local) => {
      if (local && local.default && !firebaseConfig.apiKey) {
        console.log("Loaded local Firebase config");
        // Note: Re-initializing app might be tricky, but usually applet-config 
        // is only needed in AI Studio where env vars are missing.
      }
    })
    .catch(() => {
      console.warn("No Firebase config found. Please set your environment variables on Netlify.");
    });
}

export const signIn = () => signInWithPopup(auth, googleProvider);
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
