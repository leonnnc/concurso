// ═══════════════════════════════════════════════════════
//  ui.js — Utilidades de UI: modales, toasts, menú
//  (NO es módulo ES — se carga como script normal)
// ═══════════════════════════════════════════════════════

// ── MODALES ──
function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
  document.body.style.overflow = "";
}
function closeModalOutside(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}
function switchModal(fromId, toId) {
  closeModal(fromId);
  setTimeout(() => showModal(toId), 200);
}

// ── TOAST ──
function showToast(msg, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icon = type === "success" ? "✓" : "✕";
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "opacity .3s, transform .3s";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── MENÚ HAMBURGUESA ──
function toggleMenu() {
  const links = document.getElementById("navLinks");
  const ham   = document.getElementById("hamburger");
  if (links) links.classList.toggle("open");
  if (ham)   ham.classList.toggle("open");
}

// Navbar scroll
window.addEventListener("scroll", () => {
  const nav = document.getElementById("navbar");
  if (nav) nav.classList.toggle("scrolled", window.scrollY > 60);
}, { passive: true });

// Anclas smooth
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// Exponer globalmente
window.showModal   = showModal;
window.closeModal  = closeModal;
window.closeModalOutside = closeModalOutside;
window.switchModal = switchModal;
window.showToast   = showToast;
window.toggleMenu  = toggleMenu;

// Toast container si no existe
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("toastContainer")) {
    const tc = document.createElement("div");
    tc.className = "toast-container";
    tc.id = "toastContainer";
    document.body.appendChild(tc);
  }
});
