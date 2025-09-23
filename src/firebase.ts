import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUgjlIIplU2Mh92HIUKcU-40pdb-ihy2Q",
  authDomain: "animanager-805bc.firebaseapp.com",
  projectId: "animanager-805bc",
  storageBucket: "animanager-805bc.firebasestorage.app",
  messagingSenderId: "178608959958",
  appId: "1:178608959958:web:3129244895b32ab53df477",
  measurementId: "G-1DXE1W9QE8"
};


export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// mantiene la sesión aunque se cierre la pestaña o se reinicie el navegador
setPersistence(auth, browserLocalPersistence);