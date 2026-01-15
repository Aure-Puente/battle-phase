// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4uDvmg7Jo9m06yNzpxJbaQBMRp5i_OG0",
  authDomain: "yu-gi-oh-app-adc63.firebaseapp.com",
  projectId: "yu-gi-oh-app-adc63",
  storageBucket: "yu-gi-oh-app-adc63.firebasestorage.app",
  messagingSenderId: "90569884783",
  appId: "1:90569884783:web:b27b435d97e7f59e16799a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 👉 Exportamos lo que va a usar la app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
