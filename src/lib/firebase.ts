import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

/**
 * During a static export build, we may run in a Node environment where the
 * Firebase public config isn't set.  Instead of throwing and breaking the build,
 * we simply avoid initializing Firebase.  The client will initialise at runtime
 * where the variables are definitely available.
 */
const canInitialize = typeof window !== "undefined" && apiKey;

const firebaseConfig = {
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
if (canInitialize) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
}

const auth: Auth | undefined = app ? getAuth(app) : undefined;
const db: Firestore | undefined = app ? getFirestore(app) : undefined;

export { app, auth, db };
