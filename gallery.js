// ═══════════════════════════════════════════════════════
//  gallery.js — Galería: subida, display, lightbox
// ═══════════════════════════════════════════════════════

import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, where, limit, startAfter,
  serverTimestamp, getDoc, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { db, storage } from "./firebase-config.js";

// ── ESTADO ──
let allPhotos      = [];
let filteredPhotos = [];
let currentFilter  = "all";
let lightboxIdx    = 0;
let lastDoc        = null;
let selectedFile   = null;
const PAGE_SIZE    = 12;

// ── INIT ──
let galleryInitialized = false;
window.addEventListener("authStateChanged", () => {
  galleryInitialized = true;
  loadGallery();
  loadBgCarousel();
});
// Cargar si el evento auth no llega en 1.5s (usuario no autenticado)
setTimeout(() => {
  if (!galleryInitialized) {
    loadGallery();
    loadBgCarousel();
  }
}, 1500);

// ── CARGA FOTOS (solo del usuario logueado) ──
async function loadGallery() {
  const uid = window.__currentUser?.uid;
  try {
    let q;
    if (uid) {
      q = query(
        collection(db, "photos"),
        where("uid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );
    } else {
      // Sin sesión: galería vacía, solo mostrar mensaje
      document.getElementById("galleryGrid").innerHTML = "";
      document.getElementById("galleryEmpty").classList.remove("hidden");
      document.getElementById("loadMoreBtn").style.display = "none";
      updatePhotoCount();
      return;
    }
    const snap = await getDocs(q);
    allPhotos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    lastDoc = snap.docs[snap.docs.length - 1];
    document.getElementById("loadMoreBtn").style.display = snap.docs.length === PAGE_SIZE ? "inline-flex" : "none";
    applyFilter(currentFilter);
    updatePhotoCount();
  } catch (err) {
    console.error("Error cargando galería:", err);
  }
}

window.loadMorePhotos = async function() {
  if (!lastDoc) return;
  const uid = window.__currentUser?.uid;
  if (!uid) return;
  try {
    const q = query(
      collection(db, "photos"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
    const snap = await getDocs(q);
    const newPhotos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    allPhotos = [...allPhotos, ...newPhotos];
    lastDoc = snap.docs[snap.docs.length - 1] || null;
    if (!snap.docs.length || snap.docs.length < PAGE_SIZE) {
      document.getElementById("loadMoreBtn").style.display = "none";
    }
    applyFilter(currentFilter);
    updatePhotoCount();
  } catch (err) {
    console.error("Error cargando más fotos:", err);
  }
};

// ── FILTROS ──
window.filterGallery = function(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll(".filter-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  applyFilter(filter);
};

function applyFilter(filter) {
  if (filter === "recent") {
    filteredPhotos = [...allPhotos].slice(0, 6);
  } else {
    filteredPhotos = [...allPhotos];
  }
  renderGallery();
}

// ── RENDER ──
function renderGallery() {
  const grid  = document.getElementById("galleryGrid");
  const empty = document.getElementById("galleryEmpty");
  // Quitar skeletons
  grid.querySelectorAll(".photo-skeleton").forEach(s => s.remove());

  if (!filteredPhotos.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  const uid = window.__currentUser?.uid;
  grid.innerHTML = filteredPhotos.map((p, i) => {
    const isMine = uid && p.uid === uid;
    const alias  = p.alias || "anónimo";
    const initials = alias[0].toUpperCase();
    return `
      <div class="photo-card ${isMine ? "is-mine" : ""}"
           onclick="openLightbox(${i})"
           data-id="${escHtml(p.id)}"
           data-path="${escHtml(p.storagePath || "")}">
        <img src="${escHtml(p.url)}" alt="${escHtml(p.title || "Foto")}" loading="lazy" />
        ${isMine ? `<span class="photo-card-mine">MI FOTO</span>` : ""}
        ${isMine ? `<button class="photo-card-delete" onclick="deletePhoto(event, this)">✕</button>` : ""}
        <div class="photo-card-overlay">
          <p class="photo-card-title">${escHtml(p.title || "Sin título")}</p>
          <div class="photo-card-author">
            <div class="card-avatar">${escHtml(initials)}</div>
            <span>@${escHtml(alias)}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function updatePhotoCount() {
  const el = document.getElementById("photoCount");
  if (el) el.textContent = allPhotos.length;
}

// ── CARRUSEL DE FONDO GALERÍA ──
async function loadBgCarousel() {
  try {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"), limit(8));
    const snap = await getDocs(q);
    const photos = snap.docs.map(d => d.data().url).filter(Boolean);
    if (!photos.length) return;
    const bg = document.getElementById("galleryBg");
    if (!bg) return;
    let slides = photos.map(url => {
      const div = document.createElement("div");
      div.className = "gallery-bg-slide";
      div.style.backgroundImage = `url(${url})`;
      bg.appendChild(div);
      return div;
    });
    let cur = 0;
    slides[0].classList.add("visible");
    setInterval(() => {
      slides[cur].classList.remove("visible");
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add("visible");
    }, 4500);
  } catch (e) {
    console.warn("BG carousel error:", e);
  }
}

// ── LIGHTBOX ──
window.openLightbox = function(idx) {
  lightboxIdx = idx;
  const p = filteredPhotos[idx];
  if (!p) return;
  const lb = document.getElementById("lightbox");
  document.getElementById("lightboxImg").src = p.url;
  document.getElementById("lightboxTitle").textContent = p.title || "Sin título";
  document.getElementById("lightboxDesc").textContent  = p.description || "";
  document.getElementById("lightboxAlias").textContent = "@" + (p.alias || "anónimo");
  document.getElementById("lightboxAvatar").textContent = (p.alias || "A")[0].toUpperCase();
  document.getElementById("lightboxDate").textContent = p.createdAt?.toDate
    ? p.createdAt.toDate().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  lb.classList.add("active");
  document.body.style.overflow = "hidden";
};
window.closeLightbox = function(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById("lightbox").classList.remove("active");
  document.body.style.overflow = "";
};
window.lightboxNav = function(dir) {
  const next = (lightboxIdx + dir + filteredPhotos.length) % filteredPhotos.length;
  openLightbox(next);
};
document.addEventListener("keydown", e => {
  const lb = document.getElementById("lightbox");
  if (!lb.classList.contains("active")) return;
  if (e.key === "Escape")       closeLightbox();
  if (e.key === "ArrowRight")   lightboxNav(1);
  if (e.key === "ArrowLeft")    lightboxNav(-1);
});

// ── UPLOAD PANEL ──
window.showUploadPanel = function() {
  if (!window.__currentUser) { showModal("loginModal"); return; }
  document.getElementById("uploadPanel").classList.add("active");
  document.body.style.overflow = "hidden";

  // Mostrar aviso si se acerca al límite
  const count = allPhotos.length;
  const remaining = 15 - count;
  const warningEl = document.getElementById("uploadQuotaWarning");
  if (warningEl) {
    if (remaining <= 3 && remaining > 0) {
      warningEl.textContent = `⚠️ Te quedan ${remaining} foto${remaining !== 1 ? "s" : ""} disponibles de 15.`;
      warningEl.classList.remove("hidden");
    } else if (remaining === 0) {
      warningEl.textContent = "🚫 Alcanzaste el límite de 15 fotografías.";
      warningEl.classList.remove("hidden");
    } else {
      warningEl.classList.add("hidden");
    }
  }
};
window.hideUploadPanel = function() {
  document.getElementById("uploadPanel").classList.remove("active");
  document.body.style.overflow = "";
  resetUpload();
};

// ── DRAG & DROP ──
window.handleDragOver = function(e) {
  e.preventDefault();
  document.getElementById("dropZone").classList.add("drag-over");
};
window.handleDragLeave = function() {
  document.getElementById("dropZone").classList.remove("drag-over");
};
window.handleDrop = function(e) {
  e.preventDefault();
  document.getElementById("dropZone").classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
};
window.handleFileSelect = function(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
};

function processFile(file) {
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/tiff", "image/bmp", "image/gif"];
  const errEl = document.getElementById("uploadError");
  errEl.classList.add("hidden");

  if (!validTypes.includes(file.type)) {
    showUploadError("Solo se aceptan archivos JPG, PNG y WEBP.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showUploadError("El archivo supera el límite de 10 MB.");
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      if (img.width < 1200 || img.height < 800) {
        showUploadError(`Resolución insuficiente: ${img.width}×${img.height}px. Mínimo 1200×800px.`);
        selectedFile = null;
        return;
      }
      document.getElementById("previewImg").src = e.target.result;
      document.getElementById("previewInfo").textContent =
        `${img.width}×${img.height}px · ${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type}`;
      document.getElementById("uploadPreview").classList.remove("hidden");
      document.getElementById("uploadBtn").disabled = false;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── SUBIDA A FIREBASE STORAGE ──
window.handleUpload = async function() {
  const user  = window.__currentUser;
  const profile = window.__userProfile;
  if (!user || !selectedFile) return;

  // Verificar cuota
  const countQ = query(collection(db, "photos"), where("uid", "==", user.uid));
  const countSnap = await getDocs(countQ);
  if (countSnap.size >= 15) {
    showUploadError("Alcanzaste el límite de 15 fotografías.");
    return;
  }

  const title = document.getElementById("photoTitle").value.trim() || "Sin título";
  const desc  = document.getElementById("photoDesc").value.trim();
  const alias = profile?.alias || user.email.split("@")[0];

  const progress = document.getElementById("uploadProgress");
  const fill     = document.getElementById("progressFill");
  const pText    = document.getElementById("progressText");
  const btn      = document.getElementById("uploadBtn");
  progress.classList.remove("hidden");
  btn.disabled = true;

  const ext      = selectedFile.name.split(".").pop();
  const fileName = `photos/${user.uid}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, fileName);
  const task = uploadBytesResumable(storageRef, selectedFile);

  task.on("state_changed",
    (snap) => {
      const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
      fill.style.width = pct + "%";
      pText.textContent = `Subiendo... ${pct}%`;
    },
    (err) => {
      showUploadError("Error al subir la imagen. Intenta de nuevo.");
      progress.classList.add("hidden");
      btn.disabled = false;
    },
    async () => {
      const url = await getDownloadURL(task.snapshot.ref);
      await addDoc(collection(db, "photos"), {
        uid: user.uid,
        alias,
        title,
        description: desc,
        url,
        storagePath: fileName,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "users", user.uid), { photoCount: increment(1) }).catch(() => {});
      pText.textContent = "¡Foto publicada!";
      // Avisar si se acerca al límite
      const newCount = allPhotos.length + 1;
      if (newCount >= 13) {
        showToast(`¡Foto publicada! Te quedan ${15 - newCount} foto${15 - newCount !== 1 ? "s" : ""} disponibles.`, "success");
      } else {
        showToast("¡Foto publicada con éxito!", "success");
      }
      setTimeout(() => {
        hideUploadPanel();
        loadGallery();
        loadBgCarousel();
      }, 800);
    }
  );
};

// ── ELIMINAR FOTO ──
window.deletePhoto = async function(e, btn) {
  e.stopPropagation();
  const card = btn.closest(".photo-card");
  const photoId     = card?.dataset.id;
  const storagePath = card?.dataset.path;
  if (!photoId) return;
  if (!confirm("¿Eliminar esta fotografía del concurso?")) return;
  try {
    await deleteDoc(doc(db, "photos", photoId));
    if (storagePath) {
      await deleteObject(ref(storage, storagePath)).catch(() => {});
    }
    await updateDoc(doc(db, "users", window.__currentUser.uid), {
      photoCount: increment(-1)
    }).catch(() => {});
    showToast("Foto eliminada.", "success");
    allPhotos = allPhotos.filter(p => p.id !== photoId);
    applyFilter(currentFilter);
    updatePhotoCount();
  } catch (err) {
    showToast("Error al eliminar la foto.", "error");
  }
};

// ── HELPERS ──
function resetUpload() {
  selectedFile = null;
  document.getElementById("previewImg").src = "";
  document.getElementById("uploadPreview").classList.add("hidden");
  document.getElementById("uploadProgress").classList.add("hidden");
  document.getElementById("progressFill").style.width = "0%";
  document.getElementById("uploadError").classList.add("hidden");
  document.getElementById("uploadBtn").disabled = true;
  document.getElementById("photoTitle").value = "";
  document.getElementById("photoDesc").value = "";
  document.getElementById("fileInput").value = "";
}
function showUploadError(msg) {
  const el = document.getElementById("uploadError");
  el.textContent = msg;
  el.classList.remove("hidden");
}
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
