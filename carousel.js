// ═══════════════════════════════════════════════════════
//  carousel.js — Carrusel de fondo del hero con fotos
// ═══════════════════════════════════════════════════════

import {
  collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase-config.js";

async function initHeroCarousel() {
  try {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"), limit(9));
    const snap = await getDocs(q);
    const photos = snap.docs.map(d => d.data().url).filter(Boolean);
    if (!photos.length) return; // Mantener placeholder animado
    
    const carousel = document.getElementById("heroCarousel");
    if (!carousel) return;
    carousel.innerHTML = "";

    let current = 0;
    const slides = photos.map(url => {
      const div = document.createElement("div");
      div.className = "bg-slide";
      div.style.backgroundImage = `url(${url})`;
      carousel.appendChild(div);
      return div;
    });

    // Mostrar primero
    slides[0].classList.add("visible");

    // Rotar cada 5s
    setInterval(() => {
      slides[current].classList.remove("visible");
      current = (current + 1) % slides.length;
      slides[current].classList.add("visible");
    }, 5000);

    // Actualizar estadísticas
    const participantsEl = document.getElementById("statParticipants");
    const photosEl       = document.getElementById("statPhotos");
    if (photosEl) animateCount(photosEl, snap.docs.length);

    // Contar usuarios únicos
    const uids = new Set(snap.docs.map(d => d.data().uid));
    if (participantsEl) animateCount(participantsEl, uids.size);

  } catch (e) {
    console.warn("Hero carousel error:", e);
  }
}

function animateCount(el, target) {
  const duration = 1200;
  const start = performance.now();
  const step = (now) => {
    const pct = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(pct * target);
    if (pct < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}


initHeroCarousel();
