import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCtG1vgv-VMcm6fYl66SItdRMmxbV8cYiE",
  authDomain: "familion-4730c.firebaseapp.com",
  projectId: "familion-4730c",
  storageBucket: "familion-4730c.firebasestorage.app",
  messagingSenderId: "490578383261",
  appId: "1:490578383261:web:dd02a066657e1cba4e9f74",
  measurementId: "G-RYJ7V8H2TL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, auth, analytics };
