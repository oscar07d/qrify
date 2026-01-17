import { protegerPagina, logout, auth } from "../js/auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

protegerPagina();

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

// ELEMENTOS UI
const formInvitado = document.getElementById("formInvitado");
const listaInvitados = document.getElementById("lista");
const vistaInvitados = document.getElementById("vistaInvitados");
const vistaPersonal = document.getElementById("vistaPersonal");
const btnVerPersonal = document.getElementById("btnVerPersonal");
const btnVolver = document.getElementById("btnVolver");
const formStaff = document.getElementById("formStaff");
const listaStaffUI = document.getElementById("listaStaff");

/* ==========================================
   NAVEGACIÓN ENTRE VISTAS
   ========================================== */
btnVerPersonal.addEventListener("click", () => {
    vistaInvitados.classList.add("hidden");
    vistaPersonal.classList.remove("hidden");
    cargarStaff(); // Cargamos el personal al abrir la vista
});

btnVolver.addEventListener("click", () => {
    vistaPersonal.classList.add("hidden");
    vistaInvitados.classList.remove("hidden");
});

/* ==========================================
   GESTIÓN DE INVITADOS
   ========================================== */
formInvitado.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value.trim();
  const codigo = document.getElementById("customId").value.trim();

  try {
    const docRef = doc(db, "invitaciones", codigo);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) return alert("⚠️ Error: Ya existe ese ID.");

    await setDoc(docRef, { nombre, permitido: true, usado: false, creado_en: new Date() });
    formInvitado.reset();
    cargarInvitados();
    alert(`✅ Invitación creada para ${nombre}`);
  } catch (error) {
    alert("Error de permisos: Solo Admins y Lideres pueden registrar.");
  }
});

function cargarInvitados() {
    // CAMBIO: Usamos "lista" que es el ID que tienes en tu HTML
    const listaUI = document.getElementById("lista");
    
    onSnapshot(collection(db, "invitaciones"), (snapshot) => {
        listaUI.innerHTML = ""; 

        if (snapshot.empty) {
            listaUI.innerHTML = '<p style="text-align:center; color:#aaa; padding:20px;">No hay invitados registrados aún.</p>';
            return;
        }

        snapshot.forEach((docu) => {
          const data = docu.data();
          const id = docu.id;
          
          const div = document.createElement("div");
          div.className = "guest-card";
          div.innerHTML = `
              <div class="guest-info">
                  <span class="guest-name">${data.nombre}</span>
                  <span class="guest-code">ID: ${id}</span>
                  <div class="status-badge ${data.usado ? 'used' : 'active'}">
                      ${data.usado ? '⛔ Usado' : '✅ Activo'}
                  </div>
              </div>
              
              <button onclick="eliminarInvitado('${id}')" class="btn-icon-del">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                      <path d="M276.78-110.78q-42.24 0-71.62-29.38-29.38-29.38-29.38-71.62v-499h-52v-101H349v-51h261.87v51h226.35v101h-52v499q0 42.24-29.38 71.62-29.38 29.38-71.62 29.38H276.78Zm407.44-600H276.78v499h407.44v-499ZM354.83-284.07h88v-355h-88v355Zm163.34 0h88v-355h-88v355ZM276.78-710.78v499-499Z"/>
                  </svg>
              </button>
          `;
          listaUI.appendChild(div);
      });
    }, (error) => {
        console.error("Error cargando invitados: ", error);
        listaUI.innerHTML = `<p style="color:red;">Error de permisos.</p>`;
    });
}

window.eliminarInvitado = async (id) => {
    if (confirm("¿Estás seguro de eliminar a este invitado?")) {
        try {
            const docRef = doc(db, "invitaciones", id);
            await deleteDoc(docRef);
            // No necesitas llamar a cargarInvitados() porque onSnapshot lo hace solo
            console.log("Invitado eliminado");
        } catch (error) {
            console.error("Error al eliminar invitado:", error);
            alert("Error de permisos: Solo Admins o Líderes pueden borrar.");
        }
    }
};

/* ==========================================
   GESTIÓN DE PERSONAL (STAFF)
   ========================================== */
formStaff.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("staffEmail").value.trim().toLowerCase();
    const rol = document.getElementById("staffRol").value;

    try {
        // AQUÍ ESTÁ EL SECRETO: Usamos 'email' como el nombre del documento
        const docRef = doc(db, "usuarios_autorizados", email); 
        await setDoc(docRef, {
            email: email,
            rol: rol,
            creado_en: new Date()
        });
        formStaff.reset();
        alert("✅ " + email + " ahora es " + rol);
    } catch (error) {
        alert("❌ No tienes permisos de Admin para autorizar personal.");
    }
});

function cargarStaff() {
    // Escucha en tiempo real la colección de personal
    onSnapshot(collection(db, "usuarios_autorizados"), (snapshot) => {
        const listaStaffUI = document.getElementById("listaStaff");
        listaStaffUI.innerHTML = "";
        
        if (snapshot.empty) {
            listaStaffUI.innerHTML = '<p style="color:#aaa; padding:10px;">No hay personal registrado.</p>';
            return;
        }

        snapshot.forEach((docu) => {
            const user = docu.data();
            const esAdminPrincipal = user.rol === 'admin';

            listaStaffUI.innerHTML += `
                <div class="staff-item">
                    <div class="staff-info">
                        <h4>${user.email}</h4>
                        <p>Rango: <strong>${user.rol.replace('_', ' ').toUpperCase()}</strong></p>
                    </div>
                    <div class="staff-actions">
                        <select class="select-rol-small" onchange="actualizarRol('${docu.id}', this.value)">
                            <option value="staff" ${user.rol === 'staff' ? 'selected' : ''}>Staff</option>
                            <option value="staff_lider" ${user.rol === 'staff_lider' ? 'selected' : ''}>Líder</option>
                            <option value="admin" ${user.rol === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>

                        ${!esAdminPrincipal ? `
                            <button class="btn-del-staff" onclick="eliminarStaff('${docu.id}')" title="Eliminar Acceso">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                                    <path d="M276.78-110.78q-42.24 0-71.62-29.38-29.38-29.38-29.38-71.62v-499h-52v-101H349v-51h261.87v51h226.35v101h-52v499q0 42.24-29.38 71.62-29.38 29.38-71.62 29.38H276.78Zm407.44-600H276.78v499h407.44v-499ZM354.83-284.07h88v-355h-88v355Zm163.34 0h88v-355h-88v355ZM276.78-710.78v499-499Z"/>
                                </svg>
                            </button>
                        ` : '<span style="font-size:11px; color:#666; margin-left:10px;">Protegido</span>'}
                    </div>
                </div>`;
        });
    });
}

window.actualizarRol = async (id, nuevoRol) => {
    try {
        const docRef = doc(db, "usuarios_autorizados", id);
        await updateDoc(docRef, {
            rol: nuevoRol
        });
        // No hace falta alert, el onSnapshot actualizará la UI solo
    } catch (error) {
        console.error("Error al actualizar rol:", error);
        alert("No tienes permisos suficientes para cambiar roles.");
    }
};

// Función global para eliminar staff
window.eliminarStaff = async (id) => {
    if (confirm(`¿Quitar permisos a ${id}?`)) {
        try {
            await deleteDoc(doc(db, "usuarios_autorizados", id));
        } catch (error) { alert("Error al eliminar."); }
    }
};

/* ==========================================
   CONTROL DE ACCESO Y ROLES
   ========================================== */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const emailLimpio = user.email.toLowerCase();
    console.log("Intentando validar a:", emailLimpio);

    try {
      // Referencia al documento del usuario
      const userRef = doc(db, "usuarios_autorizados", emailLimpio);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const datos = docSnap.data();
        console.log("Rol detectado:", datos.rol);

        // 1. CARGAR INVITADOS (Ahora que sabemos que está autorizado)
        cargarInvitados();

        // 2. MOSTRAR BOTÓN PERSONAL SI ES ADMIN
        if (datos.rol === 'admin') {
          if (btnVerPersonal) btnVerPersonal.classList.remove("hidden");
        }
        
        // 3. OCULTAR CREACIÓN SI ES STAFF BÁSICO
        if (datos.rol === 'staff') {
          const areaCreacion = document.querySelector(".action-area");
          if(areaCreacion) areaCreacion.classList.add("hidden");
        }

      } else {
        console.error("El usuario no existe en la colección usuarios_autorizados");
        alert("Tu cuenta no tiene permisos de acceso.");
        await auth.signOut();
        window.location.href = "../login/index.html";
      }
    } catch (error) {
      console.error("Error crítico de Firebase:", error);
      // Si sale error de permisos aquí, es porque las Reglas de la colección usuarios_autorizados están mal
    }
  } else {
    window.location.href = "../login/index.html";
  }
});

document.getElementById("logout").addEventListener("click", async () => {
  await logout();
  window.location.href = "../login/index.html";
});
