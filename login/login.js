// Agregamos las importaciones que faltaban
import { loginEmail, loginGoogle, auth } from "../js/auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const db = getFirestore(); // Inicializamos db para usarlo aquí
const form = document.getElementById("loginForm");
const error = document.getElementById("error");
const googleBtn = document.getElementById("googleBtn");

// Detectar a dónde volver
const params = new URLSearchParams(window.location.search);
const redirect = params.get("redirect") || "../admin/index.html";

// FUNCIÓN PARA VALIDAR ACCESO (Aquí era donde faltaba 'doc' y 'getDoc')
async function validarYRedirigir(user) {
  try {
    const emailLogin = user.email.toLowerCase();
    const docRef = doc(db, "usuarios_autorizados", emailLogin);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Si existe en la lista de staff, entramos
      window.location.href = redirect;
    } else {
      // Si no existe, lo sacamos
      await auth.signOut();
      error.textContent = `⛔ Acceso denegado: ${emailLogin} no está en la lista.`;
      error.style.color = "#ff4d4d";
    }
  } catch (err) {
    console.error("Error en validación:", err);
    error.textContent = "Error técnico al verificar permisos.";
  }
}

// LOGIN EMAIL
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const emailVal = document.getElementById("email").value;
  const passVal = document.getElementById("password").value;
  try {
    const userCredential = await loginEmail(emailVal, passVal);
    validarYRedirigir(userCredential.user);
  } catch (err) {
    error.textContent = "Credenciales incorrectas";
  }
});

// LOGIN GOOGLE
googleBtn.addEventListener("click", async () => {
  try {
    const userCredential = await loginGoogle();
    // userCredential ya contiene el objeto user
    validarYRedirigir(userCredential.user);
  } catch (err) {
    console.error("Error Google:", err);
    error.textContent = "Error al iniciar con Google";
  }
});
