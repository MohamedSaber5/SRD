import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4pAHILx_AFP8lHtV3F9hE6Y0_tg9G7r8",
  authDomain: "srd-system.firebaseapp.com",
  projectId: "srd-system",
  storageBucket: "srd-system.firebasestorage.app",
  messagingSenderId: "533558046147",
  appId: "1:533558046147:web:0585e93b4c0cff3816e176",
  measurementId: "G-Y960T4Q22J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Attempting 'default' without parentheses as seen in the user's console
const db = getFirestore(app, "default");

console.log("🔥 Firebase Initialized for Project:", firebaseConfig.projectId);

let analytics = null;
try {
  // Only initialize analytics in supported environments
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics failed to initialize:", e);
}

export { app, auth, db, analytics };
