import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtqY3gagXUpH1AmSCbB6aBCjIP0ppvyfs",
  authDomain: "freelaja-45207.firebaseapp.com",
  projectId: "freelaja-45207",
  storageBucket: "freelaja-45207.firebasestorage.app",
  messagingSenderId: "638833250944",
  appId: "1:638833250944:web:24fdc1eabd78c1ab8a0c65"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// 🔥 AUTH
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();