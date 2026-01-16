// 1. IMPORTA "auth" y "onAuthStateChanged"
import { protegerPagina, logout, auth } from "../js/auth.js"; // <--- Asegúrate de importar 'auth' aquí
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js"; // <--- Importa esto

protegerPagina();

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAsFvO8kn67uL65x-4HXloIZUxhiLSHeQ",
  authDomain: "qrify-oscar07dstudios.firebaseapp.com",
  projectId: "qrify-oscar07dstudios",
  storageBucket: "qrify-oscar07dstudios.firebasestorage.app",
  messagingSenderId: "157169510930",
  appId: "1:157169510930:web:c01730ae615668da3046cb"
};

// Nota: Como ya inicializaste 'app' en auth.js, idealmente podrías exportar 'db' desde allí también, 
// pero dejarlo así no rompe nada por ahora.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("formInvitado");
const lista = document.getElementById("lista");

/* ==========================================
   CREAR INVITACIÓN
   ========================================== */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const nombreInput = document.getElementById("nombre");
  const idInput = document.getElementById("customId");
  const nombre = nombreInput.value.trim();
  const codigo = idInput.value.trim();

  if (!nombre || !codigo) return;

  try {
    const docRef = doc(db, "invitaciones", codigo);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      alert("⚠️ Error: Ya existe una invitación con ese ID.");
      return;
    }

    await setDoc(docRef, {
      nombre: nombre,
      permitido: true,
      usado: false,
      creado_en: new Date()
    });

    form.reset();
    idInput.focus();
    cargarInvitados(); // Aquí sí podemos llamar directo porque ya sabemos que estás logueado al enviar
    alert(`✅ Invitación creada para ${nombre}`);

  } catch (error) {
    console.error("Error al crear:", error);
    alert("Error de permisos o conexión.");
  }
});

/* ==========================================
   CARGAR LISTA
   ========================================== */
async function cargarInvitados() {
  lista.innerHTML = '<p style="color:#aaa; padding:10px;">Cargando...</p>';
  
  try {
    const q = query(collection(db, "invitaciones")); // Puedes agregar orderBy aqui si quieres
    const querySnapshot = await getDocs(q);
    
    lista.innerHTML = ""; 

    if (querySnapshot.empty) {
      lista.innerHTML = '<p style="color:#aaa; padding:10px;">No hay invitados registrados.</p>';
      return;
    }

    querySnapshot.forEach(docu => {
      const d = docu.data();
      const estadoClass = d.usado ? "used" : "active";
      const estadoText = d.usado ? "Usado" : "Activo";
      
      lista.innerHTML += `
        <div class="guest-card">
          <span class="guest-name">${d.nombre}</span>
          <span class="guest-code">ID: ${docu.id}</span>
          <div class="status-badge ${estadoClass}">
              ${d.usado ? '⛔' : '✅'} ${estadoText}
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error cargando lista:", error);
    lista.innerHTML = '<p style="color:red;">No tienes permisos para ver esto.</p>';
  }
}

/* ==========================================
   LOGOUT
   ========================================== */
document.getElementById("logout").addEventListener("click", async () => {
  await logout();
  window.location.href = "/login/";
});

/* ==========================================
   🔥 SOLUCIÓN: CARGAR SOLO SI HAY USUARIO
   ========================================== */
// En lugar de llamar cargarInvitados() directamente...
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Solo cargamos los datos si el usuario existe y está autenticado
    cargarInvitados();
  } else {
    // Si no hay usuario, no intentamos cargar nada (protegerPagina redirigirá)
    console.log("Usuario no autenticado, esperando redirección...");
  }
});