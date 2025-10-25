// auth.js - client-side Firebase Authentication + Firestore user role write
// This file expects firebase-config.js in the same directory and is used as a module in index.html
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM elements ---
const flash = document.getElementById('flash');

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');

const signupForm = document.getElementById('signupForm');
const showSignUp = document.getElementById('showSignUp');
const cancelSignUp = document.getElementById('cancelSignUp');

const resetForm = document.getElementById('resetForm');
const showReset = document.getElementById('showReset');
const cancelReset = document.getElementById('cancelReset');

const togglePassword = document.getElementById('togglePassword');
const eyeOpen = document.getElementById('eyeOpen');
const eyeClosed = document.getElementById('eyeClosed');

const loginEmail = document.getElementById('email');
const loginPassword = document.getElementById('password');
const remember = document.getElementById('remember');

const suEmail = document.getElementById('suEmail');
const suPassword = document.getElementById('suPassword');
const roleSelect = document.getElementById('role');

const resetEmail = document.getElementById('resetEmail');

function showFlash(message, type = 'info') {
  flash.textContent = message;
  flash.className = 'mb-4 p-3 rounded text-sm';
  if (type === 'error') {
    flash.classList.add('bg-red-800', 'text-red-200');
  } else if (type === 'success') {
    flash.classList.add('bg-green-800', 'text-green-200');
  } else {
    flash.classList.add('bg-gray-800', 'text-gray-200');
  }
  flash.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideFlash() {
  flash.classList.add('hidden');
  flash.textContent = '';
}

// Toggle password visibility
if (togglePassword) {
  togglePassword.addEventListener('click', () => {
    const pwd = document.getElementById('password');
    if (!pwd) return;
    const isPwd = pwd.getAttribute('type') === 'password';
    pwd.setAttribute('type', isPwd ? 'text' : 'password');
    eyeOpen.classList.toggle('hidden');
    eyeClosed.classList.toggle('hidden');
    togglePassword.setAttribute('aria-pressed', isPwd ? 'true' : 'false');
  });
}

// UI helpers to show/hide forms
function showForm(formId) {
  loginForm.classList.add('hidden');
  signupForm.classList.add('hidden');
  resetForm.classList.add('hidden');
  document.getElementById(formId).classList.remove('hidden');
  hideFlash();
}

showSignUp?.addEventListener('click', () => showForm('signupForm'));
cancelSignUp?.addEventListener('click', () => showForm('loginForm'));
showReset?.addEventListener('click', () => showForm('resetForm'));
cancelReset?.addEventListener('click', () => showForm('loginForm'));

// --- Authentication behavior ---

// Set persistence depending on "remember me"
async function setAuthPersistence(rememberMe) {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  } catch (err) {
    console.warn('Failed to set persistence', err);
  }
}

// Login
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideFlash();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showFlash('Please enter email and password.', 'error');
    return;
  }

  await setAuthPersistence(remember.checked);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will redirect to app.html
  } catch (err) {
    console.error(err);
    showFlash(err.message || 'Failed to sign in.', 'error');
  }
});

// Signup
signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideFlash();

  const email = suEmail.value.trim();
  const password = suPassword.value;
  const role = roleSelect.value || 'patient';

  if (!email || !password || password.length < 6) {
    showFlash('Provide a valid email and a password of at least 6 characters.', 'error');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Store role and metadata in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role,
      createdAt: serverTimestamp()
    });
    showFlash('Account created. Redirecting ...', 'success');
    // onAuthStateChanged will redirect to app.html
  } catch (err) {
    console.error(err);
    showFlash(err.message || 'Failed to create account.', 'error');
  }
});

// Password reset
resetForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideFlash();
  const email = resetEmail.value.trim();
  if (!email) {
    showFlash('Enter the email address to send reset link.', 'error');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showFlash('Password reset email sent. Check your inbox.', 'success');
    showForm('loginForm');
  } catch (err) {
    console.error(err);
    showFlash(err.message || 'Failed to send reset email.', 'error');
  }
});

// Auth state listener (redirect after login)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Logged in -> redirect to protected app page
    window.location.href = '/app.html';
  } else {
    // Not logged in -> stay on login page
    // Do nothing
  }
});