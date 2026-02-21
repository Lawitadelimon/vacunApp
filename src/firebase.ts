import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD7cItB12a8gw4qquKVv_pkjwinYmWGumw",
  authDomain: "animanager-29dee.firebaseapp.com",
  projectId: "animanager-29dee",
  storageBucket: "animanager-29dee.firebasestorage.app",
  messagingSenderId: "379128864512",
  appId: "1:379128864512:web:8c027e32ae39e236d35de5",
  measurementId: "G-F0E7XHKVKR"
};

// Inicializa la app
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 🔥 Inicializa Firestore con persistencia avanzada
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
