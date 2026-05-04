import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) : getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

import { customAlert } from './GlobalDialog';

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error logging in with Google", error);
    if (error.code === 'auth/popup-closed-by-user') {
      // Ignore
    } else if (error.code === 'auth/unauthorized-domain') {
      customAlert("Error Firebase: Domain ini belum diizinkan. Silakan tambahkan URL saat ini ke Firebase Console > Authentication > Settings > Authorized Domains.", "Informasi Login");
    } else {
      if (window.self !== window.top) {
        customAlert(`Login gagal dalam preview window. Silakan klik tombol "Buka di Tab Baru" (Open in New Tab) di pojok kanan atas layar dan coba login kembali.\nDetail Error: ${error.message}`, "Informasi Login");
      } else {
        customAlert(`Gagal login via Google popup: ${error.message}. Akan mencoba redirect...`, "Informasi Login");
      }
      console.log("Popup failed or blocked, falling back to redirect...");
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError: any) {
        customAlert(`Redirect login juga gagal: ${redirectError.message}`, "Error Login");
      }
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
