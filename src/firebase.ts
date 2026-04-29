import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCpZ6ktdrm9NhIbIWO_shVehBl2ULTAnRI",
  authDomain: "ngopi-ketinggian.firebaseapp.com",
  projectId: "ngopi-ketinggian",
  storageBucket: "ngopi-ketinggian.firebasestorage.app",
  messagingSenderId: "956823455201",
  appId: "1:956823455201:web:8b73637fb4684df4617ea0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
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
