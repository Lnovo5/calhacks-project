// login-auth.js - Firebase Authentication for Login Page
// Import Firebase modular SDK directly and initialize here (avoid re-importing auth/db)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase config
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

// ============================================================================
// DOM Elements
// ============================================================================

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const resetForm = document.getElementById('resetForm');
const flash = document.getElementById('flash');

const showSignUpBtn = document.getElementById('showSignUp');
const showResetBtn = document.getElementById('showReset');
const cancelSignUpBtn = document.getElementById('cancelSignUp');
const cancelResetBtn = document.getElementById('cancelReset');

const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const eyeOpen = document.getElementById('eyeOpen');
const eyeClosed = document.getElementById('eyeClosed');

// ============================================================================
// Helper Functions
// ============================================================================

function showFlash(message, type = 'success') {
  flash.textContent = message;
  flash.className = `mb-4 p-3 rounded text-sm ${
    type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' :
    type === 'error' ? 'bg-red-900/50 text-red-300 border border-red-700' :
    'bg-blue-900/50 text-blue-300 border border-blue-700'
  }`;
  flash.classList.remove('hidden');
  
  setTimeout(() => {
    flash.classList.add('hidden');
  }, 5000);
}

function showForm(formToShow) {
  loginForm.classList.add('hidden');
  signupForm.classList.add('hidden');
  resetForm.classList.add('hidden');
  formToShow.classList.remove('hidden');
  flash.classList.add('hidden');
}

function setLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = '<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading...</span>';
  } else {
    button.disabled = false;
  }
}

// ============================================================================
// Authentication Functions
// ============================================================================

async function handleSignIn(email, password, rememberMe) {
  try {
    // 1. Sign in the user
    // await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password); 
    
    // 2. Redirect on success
    showFlash('Login successful! Redirecting...', 'success');
    
    // 🚨 ENSURE THIS REDIRECT IS CORRECT 🚨
    window.location.href = 'CIPA.html'; 
    // '/' is the standard way to point to the root index file (index.html)
    
} catch (error) {
    console.error('Sign in error:', error);
    
    let errorMessage = 'Sign in failed. Please try again.';
    
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password.';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Invalid email or password.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
    }
    
    showFlash(errorMessage, 'error');
    // clearer console error without throwing
    console.error('Sign in error details:', error);
  }
}

async function handleSignUp(email, password, role) {
  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Account created:', userCredential.user.uid);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      role: role,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
    
    showFlash('Account created successfully! Redirecting...', 'success');
    
    // Redirect to dashboard after 1 second
    setTimeout(() => {
      window.location.href = 'CIPA.html'; // Change to your dashboard URL
    }, 1000);
    
  } catch (error) {
    console.error('Sign up error:', error);
    
    let errorMessage = 'Account creation failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters.';
        break;
    }
    
    showFlash(errorMessage, 'error');
    // clearer console error without throwing
    console.error('Sign up error details:', error);
  }
}

async function handlePasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent');
    
    showFlash('Password reset email sent! Check your inbox.', 'success');
    
    // Switch back to login form after 2 seconds
    setTimeout(() => {
      showForm(loginForm);
    }, 2000);
    
  } catch (error) {
    console.error('Password reset error:', error);
    
    let errorMessage = 'Failed to send reset email. Please try again.';
    
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email.';
        break;
    }
    
    showFlash(errorMessage, 'error');
    // clearer console error without throwing
    console.error('Password reset error details:', error);
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

// Toggle password visibility
togglePasswordBtn?.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  eyeOpen.classList.toggle('hidden');
  eyeClosed.classList.toggle('hidden');
});

// Show sign-up form
showSignUpBtn?.addEventListener('click', () => {
  showForm(signupForm);
});

// Show password reset form
showResetBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  showForm(resetForm);
});

// Cancel sign-up
cancelSignUpBtn?.addEventListener('click', () => {
  showForm(loginForm);
});

// Cancel password reset
cancelResetBtn?.addEventListener('click', () => {
  showForm(loginForm);
});

// Sign in form submission
// Login form submission
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  // HTML checkbox id is "remember"
  const rememberMe = (document.getElementById('remember') && document.getElementById('remember').checked) || false;
  
  if (!email || !password) {
    showFlash('Please enter both email and password.', 'error');
    return;
  }
  
  // HTML button id is "loginBtn"
  const signInBtn = document.getElementById('loginBtn');
  const originalText = signInBtn.textContent;
  setLoading(signInBtn, true);
  
  try {
    // 1. Authenticate the user
    await handleSignIn(email, password, rememberMe);
    
    // 2. 🚨 CRITICAL FIX: Redirect upon successful sign-in
    window.location.href = 'CIPA.html'; 
    
  } catch (error) {
    // Error already handled in handleSignIn
  } finally {
    // In case the redirect fails (which it shouldn't for a successful sign-in), 
    // stop the loading animation.
    signInBtn.disabled = false;
    signInBtn.textContent = originalText;
  }
});

// Sign up form submission
signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('suEmail').value.trim();
  const password = document.getElementById('suPassword').value;
  const role = document.getElementById('role').value;
  
  // Basic validation
  if (!email || !password) {
    showFlash('Please fill in all fields.', 'error');
    return;
  }
  
  if (password.length < 6) {
    showFlash('Password must be at least 6 characters.', 'error');
    return;
  }
  
  const createBtn = document.getElementById('createBtn');
  const originalText = createBtn.textContent;
  setLoading(createBtn, true);
  
  try {
    await handleSignUp(email, password, role);
  } catch (error) {
    // Error already handled in handleSignUp
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = originalText;
  }
});

// Password reset form submission
resetForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('resetEmail').value.trim();
  
  if (!email) {
    showFlash('Please enter your email address.', 'error');
    return;
  }
  
  const sendBtn = document.getElementById('sendReset');
  const originalText = sendBtn.textContent;
  setLoading(sendBtn, true);
  
  try {
    await handlePasswordReset(email);
  } catch (error) {
    // Error already handled in handlePasswordReset
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = originalText;
  }
});

// ============================================================================
// Check if user is already logged in
// ============================================================================

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ User already logged in:', user.uid);
    // Redirect to dashboard if already logged in
    // 🚨 This should also point to the main page!
    window.location.href = 'CIPA.html'; 
  }
});

console.log('🔐 Firebase Auth initialized');
