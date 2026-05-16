import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAolYvwI1kPyNuaguc4xxYCuStRfw8aLuA",
  authDomain: "aast-booking-system.firebaseapp.com",
  projectId: "aast-booking-system",
  storageBucket: "aast-booking-system.firebasestorage.app",
  messagingSenderId: "724657515386",
  appId: "1:724657515386:web:ed6ebc9f36df4b661884c3",
  measurementId: "G-SVSWFX6T14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("🔥 Firebase Initialized for Project:", firebaseConfig.projectId);

let analytics = null;
try {
  // Only initialize analytics in supported environments
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics failed to initialize:", e);
}

export { app, auth, db, analytics };
