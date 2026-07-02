import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD_yYMvK6DGRG0s7iZ57zpAj8b0O9gHcrQ',
  authDomain: 'family-medical-tracker-686ad.firebaseapp.com',
  projectId: 'family-medical-tracker-686ad',
  storageBucket: 'family-medical-tracker-686ad.firebasestorage.app',
  messagingSenderId: '514195146012',
  appId: '1:514195146012:web:f8f3f2c979d4d62818e6d9',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
