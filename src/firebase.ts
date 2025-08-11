// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2XEfx0RHgdpIKvj-xRkUbhgkwF5BuN5o",
  authDomain: "vacunapp-4c277.firebaseapp.com",
  projectId: "vacunapp-4c277",
  storageBucket: "vacunapp-4c277.firebasestorage.app",
  messagingSenderId: "254568375334",
  appId: "1:254568375334:web:5ebe81e7ff6a25b83af2e7"
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase initialized successfully");