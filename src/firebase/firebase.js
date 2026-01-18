//Firebase:
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

//JS:
const firebaseConfig = {
  apiKey: "AIzaSyC4uDvmg7Jo9m06yNzpxJbaQBMRp5i_OG0",
  authDomain: "yu-gi-oh-app-adc63.firebaseapp.com",
  projectId: "yu-gi-oh-app-adc63",
  storageBucket: "yu-gi-oh-app-adc63.firebasestorage.app",
  messagingSenderId: "90569884783",
  appId: "1:90569884783:web:b27b435d97e7f59e16799a",
};

const app = initializeApp(firebaseConfig);

// Mantiene sesión iniciada:
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
