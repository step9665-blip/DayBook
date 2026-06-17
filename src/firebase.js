import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBRKTGIcfJ_UEfAfjMB0tiqL5y9foXKnSI",
  authDomain: "daybook-5c613.firebaseapp.com",
  projectId: "daybook-5c613",
  storageBucket: "daybook-5c613.firebasestorage.app",
  messagingSenderId: "576347006125",
  appId: "1:576347006125:web:6f8285ad2faed154ddd224",
  measurementId: "G-08VTJM99QE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
