# 📸 PhotoCDF — Concurso Fotográfico

Plataforma web completa para concurso fotográfico del Club de Fotografía (CDF).  
**Stack:** HTML5 · CSS3 · JavaScript (ES Modules) · Firebase (Auth + Firestore + Storage)

---

## 🚀 Configuración paso a paso

### 1. Crear proyecto Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Clic en **"Agregar proyecto"** → ponle nombre (ej: `photocdf-2025`)
3. Puedes desactivar Google Analytics (opcional)

### 2. Activar servicios

#### Authentication
- Ve a **Build → Authentication → Get started**
- En **Sign-in providers**, habilita **Email/Password**

#### Firestore Database
- Ve a **Build → Firestore Database → Create database**
- Elige **Production mode** (usaremos reglas personalizadas)
- Selecciona región más cercana (ej: `us-central1`)
- En la pestaña **Rules**, pega el contenido de `firestore.rules`

#### Storage
- Ve a **Build → Storage → Get started**
- Modo producción → elige región
- En **Rules**, pega el contenido de `storage.rules`

### 3. Obtener credenciales

- Ve a **Configuración del proyecto** (⚙️ en el menú lateral)
- Sección **"Tu app"** → clic en `</>` (Web)
- Registra tu app con un nombre
- Copia el objeto `firebaseConfig`

### 4. Configurar el proyecto

Abre `js/firebase-config.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSy...",           // ← Tu API Key
  authDomain:        "mi-proyecto.firebaseapp.com",
  projectId:         "mi-proyecto",
  storageBucket:     "mi-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

### 5. Publicar en GitHub Pages

```bash
# Inicializar repositorio
git init
git add .
git commit -m "feat: PhotoCDF concurso fotográfico"

# Subir a GitHub
git remote add origin https://github.com/TU_USUARIO/photocdf.git
git push -u origin main

# Activar GitHub Pages
# GitHub → Settings → Pages → Source: main → / (root)
```

Tu sitio estará disponible en:  
`https://TU_USUARIO.github.io/photocdf/`

---

## 📁 Estructura del proyecto

```
concurso-foto/
├── index.html          ← Landing: hero + premios + bases
├── gallery.html        ← Galería + subida de fotos
├── css/
│   ├── main.css        ← Estilos globales y landing
│   └── gallery.css     ← Estilos de galería y upload
├── js/
│   ├── firebase-config.js  ← ⚙️ Configuración Firebase
│   ├── auth.js             ← Login, registro, logout
│   ├── carousel.js         ← Carrusel hero + estadísticas
│   ├── gallery.js          ← Galería, upload, lightbox
│   └── ui.js               ← Modales, toasts, menú
├── firestore.rules     ← Reglas de seguridad Firestore
├── storage.rules       ← Reglas de seguridad Storage
└── README.md
```

---

## ✨ Funcionalidades

| Funcionalidad | Estado |
|---|---|
| Landing con hero animado + carrusel de fotos | ✅ |
| Bases del concurso con 8 reglas | ✅ |
| Premios 1°/2°/3° lugar | ✅ |
| Registro con alias, correo, teléfono y clave | ✅ |
| Login / Logout | ✅ |
| Galería masonry responsive | ✅ |
| Carrusel de fondo con fotos de participantes | ✅ |
| Subida de fotos con drag & drop | ✅ |
| Validación: formato JPG/PNG/WEBP, máx 10MB, mín 1200×800px | ✅ |
| Límite de 3 fotos por participante | ✅ |
| Lightbox con navegación teclado | ✅ |
| Eliminar propias fotos | ✅ |
| Filtros: todas / recientes / mis fotos | ✅ |
| Paginación (cargar más) | ✅ |
| Reglas de seguridad Firestore + Storage | ✅ |
| Diseño responsive móvil/tablet/desktop | ✅ |
| Estadísticas de participantes en tiempo real | ✅ |

---

## 🔒 Seguridad

- Las fotos solo pueden subirse autenticado
- Cada usuario solo puede subir a su propia carpeta en Storage
- Límite de 10MB y solo imágenes (validado en servidor)
- Solo el autor puede eliminar su foto
- Máximo 3 fotos verificado en cliente y recomendable también en Cloud Functions

---

## 🛠️ Próximas mejoras sugeridas

- [ ] Sistema de votación pública
- [ ] Panel de administrador para jurado
- [ ] Notificaciones por correo (Firebase Functions)
- [ ] Índice EXIF para verificar metadatos de cámara
- [ ] Categorías de fotografía
- [ ] Contador regresivo para cierre del concurso

---

## 📞 Soporte

Para cualquier consulta sobre la configuración Firebase, visita:  
[firebase.google.com/docs](https://firebase.google.com/docs)
