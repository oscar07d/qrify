import { protegerPagina, logout } from "../js/auth.js";
protegerPagina();

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";


/* ===== FIREBASE ===== */
const firebaseConfig = {
  apiKey: "AIzaSyDAsFvO8kn67uL65x-4HXloIZUxhiLSHeQ",
  authDomain: "qrify-oscar07dstudios.firebaseapp.com",
  projectId: "qrify-oscar07dstudios",
  storageBucket: "qrify-oscar07dstudios.firebasestorage.app",
  messagingSenderId: "157169510930",
  appId: "1:157169510930:web:c01730ae615668da3046cb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===== UI ===== */
const scannerBox = document.querySelector(".scanner-container");
const scanResult = document.getElementById("scanResult");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");

/* ===== SONIDOS ===== */
const sounds = {
  scan: new Audio("/assets/sounds/Escaneo detectado.mp3"),
  success: new Audio("/assets/sounds/Acceso permitido.mp3"),
  error: new Audio("/assets/sounds/Invitación inválida-ya usada.mp3"),
  system: new Audio("/assets/sounds/Error técnico.mp3")
};

const counterEl = document.getElementById("counterNumber");

const invitacionesRef = collection(db, "invitaciones");
const usadosQuery = query(invitacionesRef, where("usado", "==", true));

onSnapshot(usadosQuery, (snapshot) => {
  counterEl.textContent = snapshot.size;

  counterEl.parentElement.classList.add("bump");
  setTimeout(() => {
    counterEl.parentElement.classList.remove("bump");
  }, 300);
});



Object.values(sounds).forEach(sound => {
  sound.volume = 0.6;
});

function playSound(type) {
  const sound = sounds[type];
  if (!sound) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

/* ===== SCANNER ===== */
const scanner = new Html5Qrcode("reader");

/* ===== RESULTADOS ===== */
function mostrarResultado(tipo, titulo, mensaje) {
  scannerBox.className = `scanner-container ${tipo}`;
  scanResult.className = `scan-result ${tipo}`;
  scanResult.classList.remove("hidden");

  resultIcon.textContent = tipo === "success" ? "✅" : "⛔";
  resultTitle.textContent = titulo;
  resultMessage.textContent = mensaje;

  if (tipo === "success") playSound("success");
  if (tipo === "error") playSound("error");

  if (navigator.vibrate) {
    navigator.vibrate(tipo === "success" ? 100 : [100, 50, 100]);
  }

  setTimeout(() => {
    scanResult.classList.add("hidden");
    scannerBox.className = "scanner-container scanning";
    scanner.resume();
  }, 2500);
}

/* ===== ESTADO INICIAL ===== */
scannerBox.className = "scanner-container scanning";

/* ===== INICIAR ESCÁNER ===== */
scanner.start(
  { facingMode: "environment" },
  {
    fps: 20, // SUBIR FPS (ayuda con el movimiento y pantallas)
    qrbox: { width: 250, height: 250 }, // Un poco más grande
    aspectRatio: 1.0,
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true // 🔥 ESTO ES LA CLAVE
    }
  },
  async (codigo) => {
    scanner.pause();
    playSound("scan");

    try {
      const ref = doc(db, "invitaciones", codigo);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        mostrarResultado(
          "error",
          "Invitación inválida",
          "Este código no existe"
        );
        return;
      }

      const data = snap.data();

      if (data.usado) {
        mostrarResultado(
          "error",
          "Ya utilizada",
          "Esta invitación ya fue usada"
        );
        return;
      }

      await updateDoc(ref, {
        usado: true,
        usado_en: new Date()
      });

      mostrarResultado(
        "success",
        "Acceso permitido",
        `Bienvenido ${data.nombre}`
      );

    } catch (e) {
      playSound("system");
      mostrarResultado(
        "error",
        "Error del sistema",
        "Intenta nuevamente"
      );
    }
  }
);

/* ===== LOGOUT ===== */
document.getElementById("logout").addEventListener("click", async () => {
  await logout();
  window.location.href = "/login/";
});
