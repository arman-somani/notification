import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPwLFwk11H_zteh2kECBHvg-XhkUg64Eg",
  authDomain: "notification-app-c52d3.firebaseapp.com",
  projectId: "notification-app-c52d3",
  storageBucket: "notification-app-c52d3.firebasestorage.app",
  messagingSenderId: "134533953641",
  appId: "1:134533953641:web:5a1069451124192f94caf8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
