// Firebase Configuration & Initialization for TREENITI
// Free Tier Phone Authentication (10,000 Free SMS per month via Google)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// ⚠️ Replace with your Firebase Project Configuration from Firebase Console (https://console.firebase.google.com)
// Settings > Project Settings > General > Your Apps (Web App SDK configuration)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "treeniti-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "treeniti-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "treeniti-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456789"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Helper: Setup invisible reCAPTCHA verifier for Free Real Phone SMS OTP
export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  if (typeof window === 'undefined') return null;

  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {}
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('✅ Google reCAPTCHA verified successfully for real SMS OTP');
    },
    'expired-callback': () => {
      console.warn('⚠️ reCAPTCHA expired, please request OTP again');
    }
  });

  return window.recaptchaVerifier;
};

// Helper: Send Real Free SMS OTP via Firebase
export const sendFirebaseOtp = async (phoneNumberWithCountryCode) => {
  const verifier = setupRecaptcha('recaptcha-container');
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumberWithCountryCode, verifier);
  window.confirmationResult = confirmationResult;
  return confirmationResult;
};

// Helper: Verify the Real SMS OTP received on user's mobile
export const verifyFirebaseOtp = async (code) => {
  if (!window.confirmationResult) {
    throw new Error('No OTP request found. Please request a new OTP.');
  }
  const userCredential = await window.confirmationResult.confirm(code);
  return userCredential.user;
};
