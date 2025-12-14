
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyALulXbYBa_9DaEtrbf3ETuysuxr-2P7tc",
  authDomain: "dryfruitshop-db1b9.firebaseapp.com",
  projectId: "dryfruitshop-db1b9",
  storageBucket: "dryfruitshop-db1b9.firebasestorage.app",
  messagingSenderId: "406000826656",
  appId: "1:406000826656:web:90bb53f3ae864a6b997f45",
  measurementId: "G-G8DDPKV361"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Force persistent login across redirect & reload
setPersistence(auth, browserLocalPersistence)
  .catch(err => console.error("Failed to set persistence:", err));

const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { app, auth, googleProvider, db };
