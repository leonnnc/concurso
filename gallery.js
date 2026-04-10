// ═══════════════════════════════════════════════════════
//  gallery.js — Galería: subida, display, lightbox
// ═══════════════════════════════════════════════════════

import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, where, limit, startAfter,
  serverTimestamp, getDoc, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase-config.js";

// ── CLOUDINARY CONFIG ──
const CLOUDINARY_CLOUD = "dxipshp0n";
const CLOUDINARY_PRESET = "photocdf_upload";

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
  const remaining = 10 - count;
  const warningEl = document.getElementById("uploadQuotaWarning");
  if (warningEl) {
    if (remaining <= 3 && remaining > 0) {
      warningEl.textContent = `⚠️ Te quedan ${remaining} foto${remaining !== 1 ? "s" : ""} disponibles de 10.`;
      warningEl.classList.remove("hidden");
    } else if (remaining === 0) {
      warningEl.textContent = "🚫 Alcanzaste el límite de 10 fotografías.";
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
  const errEl = document.getElementById("uploadError");
  errEl.classList.add("hidden");

  // Verificar que sea imagen
  if (!file.type.startsWith("image/")) {
    showUploadError("Solo se aceptan archivos de imagen.");
    return;
  }
  // Límite de 6MB
  if (file.size > 6 * 1024 * 1024) {
    showUploadError("El archivo supera el límite de 6 MB.");
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Resolución mínima 800x600
      if (img.width < 800 || img.height < 600) {
        showUploadError(`Resolución insuficiente: ${img.width}×${img.height}px. Mínimo 800×600px.`);
        selectedFile = null;
        return;
      }
      document.getElementById("previewImg").src = e.target.result;
      document.getElementById("previewInfo").textContent =
        `${img.width}×${img.height}px · ${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type}`;
      document.getElementById("uploadPreview").classList.remove("hidden");
      document.getElementById("uploadBtn").disabled = false;
    };
    img.onerror = () => {
      // Si no se puede leer como imagen (ej: HEIC en algunos navegadores), igual permitir
      document.getElementById("previewInfo").textContent =
        `${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type}`;
      document.getElementById("uploadPreview").classList.remove("hidden");
      document.getElementById("uploadBtn").disabled = false;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── SUBIDA A CLOUDINARY ──
window.handleUpload = async function() {
  const user    = window.__currentUser;
  const profile = window.__userProfile;
  if (!user || !selectedFile) return;

  // Verificar cuota
  const countQ = query(collection(db, "photos"), where("uid", "==", user.uid));
  const countSnap = await getDocs(countQ);
  if (countSnap.size >= 10) {
    showUploadError("Alcanzaste el límite de 10 fotografías.");
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

  try {
    // Subir a Cloudinary via XMLHttpRequest para mostrar progreso
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("folder", `photocdf/${user.uid}`);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        fill.style.width = pct + "%";
        pText.textContent = `Subiendo... ${pct}%`;
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        const url         = result.secure_url;
        const storagePath = result.public_id;

        await addDoc(collection(db, "photos"), {
          uid: user.uid,
          alias,
          title,
          description: desc,
          url,
          storagePath,
          createdAt: serverTimestamp()
        });

        await updateDoc(doc(db, "users", user.uid), { photoCount: increment(1) }).catch(() => {});
        pText.textContent = "¡Foto publicada!";

        const newCount = allPhotos.length + 1;
        if (newCount >= 8) {
          showToast(`¡Foto publicada! Te quedan ${10 - newCount} foto${10 - newCount !== 1 ? "s" : ""} disponibles.`, "success");
        } else {
          showToast("¡Foto publicada con éxito!", "success");
        }
        setTimeout(() => {
          hideUploadPanel();
          loadGallery();
          loadBgCarousel();
        }, 800);
      } else {
        showUploadError("Error al subir la imagen. Intenta de nuevo.");
        progress.classList.add("hidden");
        btn.disabled = false;
      }
    };

    xhr.onerror = () => {
      showUploadError("Error de conexión. Intenta de nuevo.");
      progress.classList.add("hidden");
      btn.disabled = false;
    };

    xhr.send(formData);

  } catch (err) {
    showUploadError("Error al subir la imagen. Intenta de nuevo.");
    progress.classList.add("hidden");
    btn.disabled = false;
  }
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
    // Cloudinary no permite eliminar desde el frontend sin firma
    // La imagen se limpia manualmente desde el dashboard de Cloudinary
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
