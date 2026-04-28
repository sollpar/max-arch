// src/lib/firebase.ts
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, limit, startAfter, where, getDocs } from 'firebase/firestore';

// Define configuration shape
interface AxiomFirebaseConfig extends FirebaseOptions {
  firestoreDatabaseId?: string;
}

// 1. Initial configuration from Vite environment variables (Netlify/Production)
// Defensive cleanup for common copy-paste errors
const sanitizeVar = (val: any) => {
  if (typeof val !== 'string') return val;
  let cleaned = val.trim();
  
  // Handle "VITE_VAR=VALUE" or "VAR=VALUE" formats
  if (cleaned.includes('=') && /^[A-Z0-9_]+=/.test(cleaned)) {
    cleaned = cleaned.split('=')[1];
  }

  return cleaned
    .replace(/,$/, '') // Remove trailing comma
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/[\n\r]/g, ''); // Remove newlines
};

const config: AxiomFirebaseConfig = {
  apiKey: sanitizeVar(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: sanitizeVar(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeVar(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeVar(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeVar(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeVar(import.meta.env.VITE_FIREBASE_APP_ID),
  firestoreDatabaseId: sanitizeVar(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || '(default)'
};

// 2. Resolve final config
const k = config.apiKey;
const isEnvValid = !!k && k !== 'undefined' && k !== '' && !k.startsWith('VITE_') && k.length > 20;

let app;
if (isEnvValid) {
  app = initializeApp(config);
} else {
  if (import.meta.env.PROD) {
    console.error("CRITICAL: No valid Firebase API key found in Netlify environment variables.");
  }
  // Initialize with whatever we have (expected to fail if keys are missing but prevents crash on import)
  app = initializeApp({ ...config, apiKey: config.apiKey || 'missing-key' });
}

export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId === '(default)' ? undefined : config.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error("Authentication Error:", error.code, error.message);

    if (error.code === 'auth/api-key-not-valid') {
      alert("Invalid Firebase API Key. Please verify your environment variables in your hosting dashboard.");
    } else {
      alert(`Entry denied: ${error.message}`);
    }
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

export { collection, addDoc, updateDoc, query, orderBy, onSnapshot, serverTimestamp, limit, startAfter, where, getDocs, Timestamp };
