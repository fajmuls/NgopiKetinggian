import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
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
      alert("Error: Website ini belum diizinkan oleh Firebase. Silakan hubungi admin.");
    } else {
      alert("Gagal melakukan login. Jika Anda membuka web ini di dalam frame/preview AI Studio, silakan 'Buka di Tab Baru' (Open in New Tab) untuk melakukan login Google dengan lancar.");
    }
    throw error;
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
