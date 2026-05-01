import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error logging in with Google", error);
    if (error.code === 'auth/popup-closed-by-user') {
      // Ignore
    } else if (error.code === 'auth/unauthorized-domain') {
      alert("Error: Domain ini belum diizinkan oleh Firebase. Pastikan domain web/GitHub Pages Anda sudah ditambahkan di Firebase Console > Authentication > Settings > Authorized domains.");
    } else {
      // Fallback to redirect if popup is blocked or fails due to cross-origin policies (like on GitHub pages)
      console.log("Popup failed or blocked, falling back to redirect...");
      await signInWithRedirect(auth, googleProvider);
    }
    // Don't throw if we are redirecting
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/unauthorized-domain') {
      throw error;
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out", error);
    throw error;
  }
};
