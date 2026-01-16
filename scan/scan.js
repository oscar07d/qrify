import { protegerPagina, logout } from "../js/auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// 1. CONFIGURACIÓN FIREBASE
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

// Protegemos la página de inmediato
protegerPagina();

// 2. SONIDOS
const audios = {
  scan: new Audio("../assets/sounds/scan.mp3"),
  success: new Audio("../assets/sounds/success.mp3"),
  used: new Audio("../assets/sounds/used.mp3"),
  error: new Audio("../assets/sounds/error.mp3")
};

function playSound(tipo) {
  if (audios[tipo]) {
    audios[tipo].currentTime = 0;
    audios[tipo].play().catch(e => console.log("Audio error:", e));
  }
}

// 3. LÓGICA DEL ESCÁNER (Dentro de DOMContentLoaded)
document.addEventListener("DOMContentLoaded", () => {
    
    // UI Elements
    const scanResult = document.getElementById("scanResult");
    const resultIcon = document.getElementById("resultIcon");
    const resultTitle = document.getElementById("resultTitle");
    const resultMessage = document.getElementById("resultMessage");
    const counterNumber = document.getElementById("counterNumber");
    const btnLogout = document.getElementById("logout");

    // Contador local
    let personasIngresadas = 0;
    counterNumber.textContent = personasIngresadas;

    // Inicializar Escáner
    const scanner = new Html5Qrcode("reader");

    /* ===== FUNCIÓN DE INICIO SEGURO ===== */
    function iniciarCamara() {
        const config = {
            fps: 20, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
             // Importante para leer pantallas y celulares rápido
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        };

        scanner.start(
            { facingMode: "environment" }, // Cámara trasera
            config,
            onScanSuccess,
            (errorMessage) => {
                // Errores menores de lectura (ignorar para no llenar la consola)
            }
        ).catch(err => {
            console.error("Error iniciando cámara:", err);
            // Si falla, intentamos de nuevo sin las features experimentales
            // o mostramos alerta si es permiso denegado
            alert("No se pudo iniciar la cámara. Verifica los permisos.");
        });
    }

    /* ===== CUANDO DETECTA UN QR ===== */
    async function onScanSuccess(codigo) {
        scanner.pause(); // Pausar para procesar
        playSound("scan");

        try {
            // Referencia al documento usando el ID exacto del QR
            const ref = doc(db, "invitaciones", codigo);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                mostrarResultado("error", "Invitación Inválida", "Este código no existe en el sistema.");
                return; // Importante: Salir de la función
            }

            const data = snap.data();

            if (data.usado) {
                mostrarResultado("error", "⛔ Ya Utilizada", `Entró el: ${data.usado_en ? new Date(data.usado_en.toDate()).toLocaleTimeString() : '?'}`);
                return;
            }

            // Si es válida y nueva:
            await updateDoc(ref, {
                usado: true,
                usado_en: new Date()
            });

            // Actualizar contador
            personasIngresadas++;
            counterNumber.textContent = personasIngresadas;

            mostrarResultado("success", "✅ Acceso Permitido", `Bienvenido/a, ${data.nombre}`);

        } catch (error) {
            console.error("Error Firebase:", error);
            mostrarResultado("error", "Error Técnico", "Revisa tu conexión a internet.");
        }
    }

    /* ===== MOSTRAR RESULTADO EN PANTALLA ===== */
    function mostrarResultado(tipo, titulo, mensaje) {
        // Sonido
        if(tipo === "success") playSound("success");
        else if(tipo === "error" && titulo.includes("Ya Utilizada")) playSound("used");
        else playSound("error");

        // Visual
        scanResult.className = `scan-result ${tipo}`; // Quita 'hidden', pone color
        resultIcon.innerHTML = tipo === "success" ? "✨" : "⚠️";
        resultTitle.textContent = titulo;
        resultMessage.textContent = mensaje;

        // Reiniciar escáner después de 3 segundos
        setTimeout(() => {
            scanResult.className = "scan-result hidden";
            scanner.resume(); // Volver a escanear
        }, 3000);
    }

    /* ===== BOTÓN LOGOUT ===== */
    if(btnLogout) {
        btnLogout.addEventListener("click", async () => {
            // Detener cámara antes de salir para liberar memoria
            try { await scanner.stop(); } catch(e) {}
            await logout();
            window.location.href = "../login/";
        });
    }

    // 🔥 ARRANCAMOS LA CÁMARA
    iniciarCamara();
});
