// This file centralizes your Firebase setup for all other files to import.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
