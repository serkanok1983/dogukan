import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, ref, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

let app: FirebaseApp | null = null;
let db: Database | null = null;

export function getFirebaseDb(): Database | null {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  if (!db) db = getDatabase(app);
  return db;
}

export function leaderboardRef(gameSlug: string) {
  const database = getFirebaseDb();
  if (!database) return null;
  return ref(database, `leaderboard/${gameSlug}`);
}

export function leaderboardRootRef() {
  const database = getFirebaseDb();
  if (!database) return null;
  return ref(database, "leaderboard");
}
