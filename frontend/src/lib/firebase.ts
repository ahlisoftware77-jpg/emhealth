import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

export interface FirebaseConfigType {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const defaultFirebaseConfig: FirebaseConfigType = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCNMpji_vl1jfs6NIUZ_ohsr1VRQaTm9KI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "emhealth-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "emhealth-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "emhealth-project.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "514468523871",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:514468523871:web:0156bcc56111e42af2d0ea",
};

export function getStoredFirebaseConfig(): FirebaseConfigType {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("firebase_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey && parsed.projectId) {
          return { ...defaultFirebaseConfig, ...parsed };
        }
      }
    } catch (e) {
      console.warn("Failed to parse stored firebase_config:", e);
    }
  }
  return defaultFirebaseConfig;
}

let appInstance: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;

function initFirebase(config: FirebaseConfigType = getStoredFirebaseConfig()) {
  if (getApps().length > 0) {
    appInstance = getApp();
  } else {
    appInstance = initializeApp(config);
  }
  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance);
  return appInstance;
}

// Initial initialization
initFirebase();

export const app = appInstance!;
export const auth = authInstance!;
export const db = dbInstance!;
export const googleProvider = new GoogleAuthProvider();

export function updateFirebaseConfig(newConfig: Partial<FirebaseConfigType>) {
  if (typeof window !== "undefined") {
    const current = getStoredFirebaseConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem("firebase_config", JSON.stringify(updated));
    
    // Re-initialize app if needed
    try {
      if (getApps().length > 0) {
        deleteApp(getApp());
      }
    } catch (err) {
      console.warn("Error re-initializing Firebase app:", err);
    }
    initializeApp(updated);
  }
}

export default app;
