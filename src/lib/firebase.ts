// src/lib/firebase.ts
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, limit, startAfter, where, getDocs } from 'firebase/firestore';

// Define configuration shape
interface AxiomFirebaseConfig extends FirebaseOptions {
  firestoreDatabaseId?: string;
}

// 1. Initial configuration from Vite environment variables (Netlify/Production)
// Defensive cleanup for common copy-paste errors like trailing commas or extra quotes
const sanitizeVar = (val: any) => {
  if (typeof val !== 'string') return val;
  let cleaned = val.trim();
  // Handle case where user might have pasted "KEY=VALUE"
  if (cleaned.includes('=') && (cleaned.startsWith('VITE_') || cleaned.startsWith('FIREBASE_'))) {
    cleaned = cleaned.split('=')[1];
  }
  return cleaned
    .replace(/,$/, '') // Remove trailing comma
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/[\n\r]/g, ''); // Remove newlines
};

// Log available VITE_ keys in production (names only, for debugging build env)
if (import.meta.env.PROD) {
  const keys = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
  console.info("Build Environment Keys:", keys);
}

const config: AxiomFirebaseConfig = {
  apiKey: sanitizeVar(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: sanitizeVar(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeVar(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeVar(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeVar(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeVar(import.meta.env.VITE_FIREBASE_APP_ID),
  firestoreDatabaseId: sanitizeVar(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || '(default)'
};

// 2. Resolve final config with defensive checks
const k = config.apiKey;
const isEnvValid = !!k && 
                  k !== 'undefined' && 
                  k !== '' && 
                  !k.startsWith('VITE_') && 
                  k.length > 20; // Most FB keys are > 30 chars

let app;
if (isEnvValid) {
  console.info("Firebase: Initializing with environment variables.");
  app = initializeApp(config);
} else {
  // Fallback for AI Studio Dev Mode
  let foundLocal = false;
  if (import.meta.env.DEV) {
    try {
      // @ts-ignore - Local dev only file
      const local = await import('../../firebase-applet-config.json');
      if (local && local.default) {
        console.info("Firebase: Using local fallback configuration (AI Studio Dev Mode)");
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
    if (import.meta.env.PROD) {
      console.error("CRITICAL: No valid Firebase API key found in environment variables.");
    }
    // Last resort dummy config to prevent crash during initialization
    // but this will fail during auth/firestore operations
    app = initializeApp({ ...config, apiKey: config.apiKey || 'missing-key' });
  }
}

// Error logging for production
if (import.meta.env.PROD) {
  console.info("Target Environment:", window.location.hostname);
  if (!isEnvValid) {
    console.error("CRITICAL: Firebase API Key is missing or invalid in production.");
  } else {
    // Helpful log for debugging characters/length without exposing the full key
    console.info("Config Check:", {
      keyLength: config.apiKey?.length,
      domain: config.authDomain,
      projectId: config.projectId
    });
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
    console.error("Auth Fail Details:", {
      code: error.code,
      message: error.message,
      keyLength: config.apiKey?.length,
      keyPrefix: config.apiKey ? config.apiKey.substring(0, 4) : 'none',
      domain: config.authDomain
    });

    if (error.code === 'auth/api-key-not-valid') {
      alert("Invalid Firebase API Key. Please verify your Netlify environment variables (check for trailing COMMAS or QUOTES) and trigger a new 'Deploy' with 'Clear cache'.");
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
