import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9Zb2ek-jqJQ0xAKR3XyGB8-5VaA0kvfk",
  authDomain: "house-marketplace-app-4b22c.firebaseapp.com",
  projectId: "house-marketplace-app-4b22c",
  storageBucket: "house-marketplace-app-4b22c.appspot.com",
  messagingSenderId: "1067399533717",
  appId: "1:1067399533717:web:e70fe7fdeecde9080d779c"
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore()