import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDcE9Wqz9g2n5PjTn72vjmSJZeZw0CQ7OI";

export const isFirebaseConfigured = true;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "findly-d3171.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "findly-d3171",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "findly-d3171.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "931787256700",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:931787256700:web:bb64a17c7769813631aaf9",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let authInstance;
try {
  // Use getAuth or initializeAuth if not yet initialized
  authInstance = getAuth(app);
} catch {
  authInstance = initializeAuth(app, {
    // Falls back gracefully on mobile
  });
}

export const auth = authInstance;
