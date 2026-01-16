import { loginEmail, loginGoogle } from "../js/auth.js";

const form = document.getElementById("loginForm");
const error = document.getElementById("error");
const googleBtn = document.getElementById("googleBtn");

// Detectar a dónde volver
const params = new URLSearchParams(window.location.search);
const redirect = params.get("redirect") || "../admin/";

// LOGIN EMAIL
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await loginEmail(email.value, password.value);
    window.location.href = redirect;
  } catch {
    error.textContent = "Credenciales incorrectas";
  }
});

// LOGIN GOOGLE
googleBtn.addEventListener("click", async () => {
  try {
    await loginGoogle();
    window.location.href = redirect;
  } catch {
    error.textContent = "Error al iniciar con Google";
  }
});

