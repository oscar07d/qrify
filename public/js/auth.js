import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAsFvO8kn67uL65x-4HXloIZUxhiLSHeQ",
  authDomain: "qrify-oscar07dstudios.firebaseapp.com",
  projectId: "qrify-oscar07dstudios",
  storageBucket: "qrify-oscar07dstudios.firebasestorage.app",
  messagingSenderId: "157169510930",
  appId: "1:157169510930:web:c01730ae615668da3046cb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// -------- LOGIN --------
export const loginEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

const googleProvider = new GoogleAuthProvider();
export const loginGoogle = () =>
  signInWithPopup(auth, googleProvider);

// -------- LOGOUT --------
export const logout = () => signOut(auth);

// -------- PROTEGER PÁGINAS --------
export function protegerPagina() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Guarda a dónde quería ir
      const destino = window.location.pathname;
      window.location.href = `/login/?redirect=${destino}`;
    }
  });
}
