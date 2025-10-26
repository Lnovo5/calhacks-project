// Firebase config (Copy the config object from your login-auth.js)
const firebaseConfig = {
  apiKey: "AIzaSyBk-tOaFVH7x3i9Q3FhQfw8tHPwDoGMCuA",
  authDomain: "cip-helper-calhacks.firebaseapp.com",
  projectId: "cip-helper-calhacks",
  storageBucket: "cip-helper-calhacks.firebasestorage.app",
  messagingSenderId: "982066367195",
  appId: "1:982066367195:web:a64d3cfe49f60a0dc7dafe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
