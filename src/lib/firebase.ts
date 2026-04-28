// src/lib/firebase.ts
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, limit, startAfter, where, getDocs } from 'firebase/firestore';

// Define configuration shape
interface AxiomFirebaseConfig extends FirebaseOptions {
  firestoreDatabaseId?: string;
}

// 1. Initial configuration from Vite environment variables (Netlify/Production)
const firebaseConfig: AxiomFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)'
};

// 2. Resolve final config with defensive checks
const resolveConfig = async (): Promise<AxiomFirebaseConfig> => {
  const envKey = firebaseConfig.apiKey;
  
  // A valid key should exist and not be a placeholder string like "undefined" or the variable name itself
  const isEnvValid = !!envKey && 
                    envKey !== 'undefined' && 
                    envKey !== '' && 
                    !envKey.includes('VITE_');

  if (isEnvValid) {
    return firebaseConfig;
  }

  // Fallback for AI Studio Dev Mode / Local Development
  if (import.meta.env.DEV) {
    try {
      // @ts-ignore - Local dev only file
      const local = await import('../../firebase-applet-config.json');
      if (local && local.default) {
        console.info("Firebase: Using local fallback configuration");
        return {
          ...local.default,
          firestoreDatabaseId: local.default.firestoreDatabaseId || '(default)'
        };
      }
    } catch (e) {
      // Silent catch - expected in production
    }
  }

  return firebaseConfig;
};

// Modern Vite/ESM support for top-level await
const finalConfig = await resolveConfig();

// Error logging for misconfigured environments
if (!finalConfig.apiKey || finalConfig.apiKey === 'undefined' || finalConfig.apiKey.includes('VITE_')) {
  console.error("CRITICAL: Firebase API Key is missing or invalid. Deployment will fail.");
  console.info("Target Domain:", window.location.hostname);
}

const app = initializeApp(finalConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, finalConfig.firestoreDatabaseId === '(default)' ? undefined : finalConfig.firestoreDatabaseId);
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
