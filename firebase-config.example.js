// ═══════════════════════════════════════════════════════
//  firebase-config.example.js — Plantilla de configuración
//  Copia este archivo como firebase-config.js y rellena tus valores
//  Firebase Console → Configuración del proyecto → SDK de configuración
// ═══════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT_ID.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId:             "TU_APP_ID"
};

const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

window.__firebase = { auth, db, storage };

export { auth, db, storage };
