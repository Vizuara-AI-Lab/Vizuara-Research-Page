import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCUa8bdNaS8HgcRFFzy1MUrHNeE8Db0Q07k",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vizuara-research-page.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vizuara-research-page",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "vizuara-research-page.firebasestorage.app",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:784911218648:web:5c7557232c7c0026c2a4ad",
};

const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(config);
const auth: Auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const storage: FirebaseStorage = getStorage(app);
const clientDb: Firestore = getFirestore(app);

export { auth, googleProvider, storage, clientDb };
