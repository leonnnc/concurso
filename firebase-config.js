// ═══════════════════════════════════════════════════════
//  firebase-config.js — Configuración Firebase
//  ⚠️  REEMPLAZA los valores con los de tu proyecto Firebase
// ═══════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ─── TU CONFIGURACIÓN DE FIREBASE ───────────────────────
// Reemplaza estos valores con los de tu proyecto en:
// Firebase Console → Configuración del proyecto → SDK de configuración
const firebaseConfig = {
  apiKey:            "AIzaSyCHqPm7RwTzsTRaagOhTeedMJJeQqDcuGo",
  authDomain:        "concurso2026-75368.firebaseapp.com",
  projectId:         "concurso2026-75368",
  storageBucket:     "concurso2026-75368.firebasestorage.app",
  messagingSenderId: "576894317630",
  appId:             "1:576894317630:web:f4fcffd6fa6cafd9aecd6f"
};
// ────────────────────────────────────────────────────────

const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

// Exportar para uso en otros módulos
window.__firebase = { auth, db, storage };

export { auth, db, storage };
