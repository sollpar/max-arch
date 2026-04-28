// src/lib/firebase.ts
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, limit, startAfter, where, getDocs } from 'firebase/firestore';

// Define configuration shape
interface AxiomFirebaseConfig extends FirebaseOptions {
  firestoreDatabaseId?: string;
}

// 1. Initial configuration from Vite environment variables (Netlify/Production)
const config: AxiomFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)'
};

// 2. Resolve final config with defensive checks
const k = config.apiKey;
const isEnvValid = !!k && k !== 'undefined' && k !== '' && !k.startsWith('VITE_');

let app;
if (isEnvValid) {
  app = initializeApp(config);
} else {
  // Fallback for AI Studio Dev Mode
  let foundLocal = false;
  if (import.meta.env.DEV) {
    try {
      // @ts-ignore - Local dev only file
      const local = await import('../../firebase-applet-config.json');
      if (local && local.default) {
        Object.assign(config, {
          ...local.default,
          firestoreDatabaseId: local.default.firestoreDatabaseId || '(default)'
        });
        app = initializeApp(config);
        foundLocal = true;
      }
    } catch (e) {
      // No local config
    }
  }
  
  if (!foundLocal) {
    // Last resort dummy config to prevent crash
    app = initializeApp({ ...config, apiKey: config.apiKey || 'missing' });
  }
}

// Error logging for production
if (import.meta.env.PROD) {
  console.info("Target Environment:", window.location.hostname);
  if (!isEnvValid) {
    console.error("CRITICAL: Firebase API Key is missing or invalid in production.");
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId === '(default)' ? undefined : config.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error("Auth Fail:", {
      code: error.code,
      message: error.message,
      keyPrefix: config.apiKey ? config.apiKey.substring(0, 4) : 'none',
      domain: config.authDomain
    });

    if (error.code === 'auth/api-key-not-valid') {
      alert("Invalid Firebase API Key. Please verify your Netlify environment variables and trigger a new 'Deploy' with 'Clear cache'.");
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

export { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, startAfter, where, getDocs, Timestamp };
