import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBEg0UWweBoxStq4lRLRHizL4Fnf-pHZWQ",
  authDomain: "uniloop-81eca.firebaseapp.com",
  projectId: "uniloop-81eca",
  storageBucket: "uniloop-81eca.firebasestorage.app",
  messagingSenderId: "298760296488",
  appId: "1:298760296488:web:7243106dda3865708ebd1d",
  measurementId: "G-JPCQQ1Y2GF"
};

// Singleton pattern to prevent multiple initializations
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const appId = 'uniloop-81eca';