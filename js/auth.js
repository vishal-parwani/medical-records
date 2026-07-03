import { OAuthProvider, signInWithRedirect, signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { auth } from './config.js';

export async function signInWithApple() {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  // Redirect (not popup) — mobile Safari blocks/kills popups unreliably,
  // especially when the page is opened from an in-app browser.
  await signInWithRedirect(auth, provider);
}

export async function signOut() {
  await firebaseSignOut(auth);
}
