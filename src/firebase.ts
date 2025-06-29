// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyCwp_odCB3DDc2VARqrIhEQLXnnncmRMLU",
authDomain: "vacunapp-34a5b.firebaseapp.com",
projectId: "vacunapp-34a5b",
storageBucket: "vacunapp-34a5b.appspot.com",
messagingSenderId: "315026388932",
appId: "1:315026388932:web:3f9b57281811c3ea6d1691"
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase initialized successfully");