import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBH2k-dlJoAA4tnQcUcCYRRNigEFpwTBgw",
  authDomain: "word-adventure-f9e9d.firebaseapp.com",
  projectId: "word-adventure-f9e9d",
  storageBucket: "word-adventure-f9e9d.firebasestorage.app",
  messagingSenderId: "322936768217",
  appId: "1:322936768217:web:1aaa68846832dd4defa0c8",
  measurementId: "G-Y5HTG8SRJ2"
};

const app = initializeApp(firebaseConfig);
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.info("Firebase Analytics fallback:", error.code || error.message);
}
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let initPromise = null;

function waitForAuthUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
}

async function initFirebase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    return {
      app,
      auth,
      db,
      storage,
      user: auth.currentUser || await waitForAuthUser()
    };
  })().catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

function getCurrentUser() {
  return auth.currentUser;
}

export {
  app,
  analytics,
  auth,
  db,
  storage,
  initFirebase,
  getCurrentUser
};
