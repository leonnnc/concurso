// ═══════════════════════════════════════════════════════
//  auth.js — Autenticación con Firebase Auth + Firestore
// ═══════════════════════════════════════════════════════

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

// ── ESTADO GLOBAL ──
window.__currentUser = null;
window.__userProfile = null;

// ── OBSERVER AUTH ──
onAuthStateChanged(auth, async (user) => {
  window.__currentUser = user;
  if (user) {
    // Cargar perfil del usuario
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      window.__userProfile = snap.data();
    }
    updateNavForAuth(user);
  } else {
    window.__userProfile = null;
    updateNavForGuest();
  }
  // Disparar evento personalizado para que otros módulos reaccionen
  window.dispatchEvent(new CustomEvent("authStateChanged", { detail: { user } }));
});

// ── ACTUALIZAR NAV ──
function updateNavForAuth(user) {
  const actions = document.getElementById("navActions");
  const profile = window.__userProfile;
  const alias   = profile?.alias || user.email.split("@")[0];
  if (actions) {
    actions.innerHTML = `
      <span class="nav-user">
        <span class="nav-avatar">${alias[0].toUpperCase()}</span>
        <span class="nav-alias">@${alias}</span>
      </span>
      <a href="gallery.html" class="btn-primary">Mi galería</a>
      <button class="btn-ghost" onclick="handleLogout()">Salir</button>
    `;
  }
  // En la página de galería
  const guestBanner = document.getElementById("guestBanner");
  const userBanner  = document.getElementById("userBanner");
  if (guestBanner) guestBanner.classList.add("hidden");
  if (userBanner)  {
    userBanner.classList.remove("hidden");
    const aliasEl = document.getElementById("userAlias");
    const avatarEl = document.getElementById("userAvatar");
    if (aliasEl) aliasEl.textContent = alias;
    if (avatarEl) avatarEl.textContent = alias[0].toUpperCase();
    updateQuotaDisplay(user.uid);
  }
}

function updateNavForGuest() {
  const actions = document.getElementById("navActions");
  if (actions) {
    actions.innerHTML = `
      <button class="btn-ghost" onclick="showModal('loginModal')">Entrar</button>
      <button class="btn-primary" onclick="showModal('registerModal')">Participar</button>
    `;
  }
}

async function updateQuotaDisplay(uid) {
  try {
    const { collection, query, where, getDocs } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );
    const q = query(collection(db, "photos"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const count = snap.size;
    const remaining = 3 - count;
    const quotaEl = document.getElementById("userQuota");
    if (quotaEl) {
      quotaEl.textContent = remaining > 0
        ? `Puedes subir ${remaining} foto${remaining !== 1 ? "s" : ""} más`
        : "Alcanzaste el límite de 3 fotos";
    }
  } catch (e) {
    console.warn("Quota check error:", e);
  }
}

// ── REGISTRO ──
window.handleRegister = async function(e) {
  e.preventDefault();
  const alias    = document.getElementById("regAlias").value.trim().replace(/^@/, "");
  const phone    = document.getElementById("regPhone").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const pass     = document.getElementById("regPassword").value;
  const pass2    = document.getElementById("regPassword2").value;
  const errEl    = document.getElementById("registerError");
  const btn      = document.getElementById("registerBtn") || e.submitter;

  errEl?.classList.add("hidden");

  // Validaciones
  if (pass !== pass2) {
    showError(errEl, "Las contraseñas no coinciden.");
    return;
  }
  if (alias.length < 3) {
    showError(errEl, "El alias debe tener al menos 3 caracteres.");
    return;
  }

  setLoading(btn, true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "users", cred.user.uid), {
      alias, phone, email,
      createdAt: serverTimestamp(),
      photoCount: 0
    });
    closeModal("registerModal");
    showToast(`¡Bienvenido/a @${alias}! Ya puedes subir tus fotos.`, "success");
    if (window.location.pathname.includes("gallery")) {
      // stay on gallery
    } else {
      setTimeout(() => { window.location.href = "gallery.html"; }, 1200);
    }
  } catch (err) {
    showError(errEl, friendlyError(err.code));
  } finally {
    setLoading(btn, false);
  }
};

// ── LOGIN ──
window.handleLogin = async function(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pass  = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  const btn   = document.getElementById("loginBtn") || e.submitter;

  errEl?.classList.add("hidden");
  setLoading(btn, true);
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    closeModal("loginModal");
    showToast("¡Sesión iniciada correctamente!", "success");
  } catch (err) {
    showError(errEl, friendlyError(err.code));
  } finally {
    setLoading(btn, false);
  }
};

// ── LOGOUT ──
window.handleLogout = async function() {
  await signOut(auth);
  showToast("Sesión cerrada.", "success");
  setTimeout(() => { window.location.href = "index.html"; }, 800);
};

// ── HELPERS ──
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}
function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  const textEl   = btn.querySelector(".btn-text");
  const loaderEl = btn.querySelector(".btn-loader");
  if (textEl && loaderEl) {
    textEl.classList.toggle("hidden", loading);
    loaderEl.classList.toggle("hidden", !loading);
  }
}
function friendlyError(code) {
  const map = {
    "auth/email-already-in-use":  "Este correo ya está registrado.",
    "auth/invalid-email":          "El correo electrónico no es válido.",
    "auth/weak-password":          "La contraseña debe tener al menos 6 caracteres.",
    "auth/user-not-found":         "No existe una cuenta con este correo.",
    "auth/wrong-password":         "Contraseña incorrecta.",
    "auth/invalid-credential":     "Correo o contraseña incorrectos.",
    "auth/too-many-requests":      "Demasiados intentos. Intenta más tarde.",
  };
  return map[code] || "Ocurrió un error. Inténtalo de nuevo.";
}

// Inyectar estilos de nav-user
const style = document.createElement("style");
style.textContent = `
  .nav-user { display:flex; align-items:center; gap:8px; }
  .nav-avatar {
    width:32px; height:32px;
    background:var(--gold); color:#0a0a0b;
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-family:var(--font-display); font-size:1rem;
  }
  .nav-alias { font-size:13px; color:var(--text-2); font-family:var(--font-mono); }
`;
document.head.appendChild(style);
