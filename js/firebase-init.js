// ---------- FIREBASE INIT (shared across pages) ----------
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCM8xxhXLE5ujR9HP3PWJOj_H6Z39IfvCU",
  authDomain: "emeldaz-b74c0.firebaseapp.com",
  projectId: "emeldaz-b74c0",
  storageBucket: "emeldaz-b74c0.firebasestorage.app",
  messagingSenderId: "623016431095",
  appId: "1:623016431095:web:aa7d5cde03a932b6efb2f2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ---------- SECONDARY (THROWAWAY) AUTH INSTANCE ----------
// Used only when the owner/manager creates a new staff account. Firebase's
// createUserWithEmailAndPassword signs the *current* browser in as the new
// user, which would kick the owner out of her own session. To avoid that,
// this gives out a second, independently-named Firebase App + Auth instance
// that deliberately uses in-memory persistence (never touches the shared
// localStorage/IndexedDB the browser normally uses to keep tabs signed in),
// so it can't leak into or affect the owner's real tab, or any other tab.
// Call getSecondaryAuth(), use it once, then call disposeSecondaryAuth().
function getSecondaryAuth() {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  // Fire-and-forget: in-memory persistence means nothing is written to disk,
  // so there is nothing shared with the owner's main tab or other tabs.
  setPersistence(secondaryAuth, inMemoryPersistence).catch(() => {});
  return { secondaryApp, secondaryAuth };
}

async function disposeSecondaryAuth(secondaryApp) {
  try {
    await deleteApp(secondaryApp);
  } catch (e) {
    // Non-fatal — the throwaway app just won't be cleanly torn down.
  }
}

// ---------- CLOUDINARY (unsigned upload, same account as the reference project) ----------
const CLOUDINARY_CLOUD_NAME = "dol8nmjri";
const CLOUDINARY_UPLOAD_PRESET = "listing_pic";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// ---------- HTML ESCAPING (shared, use before putting any user-supplied
// string — names, review text, phone numbers, descriptions — into innerHTML) ----------
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// ---------- CURRENCY (Naira) FORMATTING (shared across admin.html,
// book.html, order.html) ----------
// Stored prices are always plain numbers — only display formatting changes
// here, no data migration needed. Whole amounts show no decimals
// (e.g. ₦12,500); non-whole amounts show exactly two (e.g. ₦12,500.50).
function formatNaira(amount) {
  const n = Number(amount) || 0;
  const isWhole = Math.round(n * 100) % 100 === 0;
  return '\u20A6' + n.toLocaleString('en-NG', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2
  });
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
  if (!response.ok) {
    throw new Error("Image upload failed. Check your Cloudinary preset/cloud name.");
  }
  const data = await response.json();
  return data.secure_url;
}

export {
  db,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  runTransaction,
  uploadToCloudinary,
  escapeHtml,
  formatNaira,
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getSecondaryAuth,
  disposeSecondaryAuth
};

  
