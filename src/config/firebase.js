// src/config/firebase.js
// ─────────────────────────────────────────────────────────────
// Reemplaza los valores de firebaseConfig con los de tu proyecto.
// Los encontrarás en: Firebase Console → Project Settings → General
//   → Your apps → Web app → SDK setup and configuration
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "reporte-ciudadano-juchitlan.firebaseapp.com",
  projectId: "reporte-ciudadano-juchitlan",
  storageBucket: "reporte-ciudadano-juchitlan.firebasestorage.app",
  messagingSenderId: "872580068908",
  appId: "1:872580068908:web:721647aa858f6fef90c389"
};

const app       = initializeApp(firebaseConfig)
export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)
export default app
