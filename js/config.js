import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// TODO: replace with the real config from a NEW, dedicated Firebase project
// (Firebase Console → Project settings → General → Your apps → SDK setup and
// configuration). Deliberately a separate project from cards-tracker so this
// sensitive health data has its own auth/rules/billing blast radius.
const firebaseConfig = {
  apiKey: 'TODO_REPLACE',
  authDomain: 'TODO_REPLACE.firebaseapp.com',
  projectId: 'TODO_REPLACE',
  storageBucket: 'TODO_REPLACE.firebasestorage.app',
  messagingSenderId: 'TODO_REPLACE',
  appId: 'TODO_REPLACE',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
