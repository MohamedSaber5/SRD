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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics };
