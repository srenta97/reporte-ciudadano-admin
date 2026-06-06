# Reporte Ciudadano — Panel Administrativo

Sistema de administración web para el chatbot de reportes ciudadanos.  
Construido con **React + Vite + Tailwind + MUI (Berry style)** y **Firebase**.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + Vite 5 |
| UI | MUI v5 (Berry style) + Tailwind CSS |
| Routing | React Router v6 |
| Auth | Firebase Authentication |
| Base de datos | Firebase Firestore (tiempo real) |
| Almacenamiento | Firebase Storage |
| Mapa | react-leaflet + OpenStreetMap |
| Mapa de calor | leaflet.heat |
| Gráficas | Chart.js + react-chartjs-2 |
| Fechas | date-fns |

---

## Instalación

### 1. Clonar e instalar dependencias

```bash
cd reporte-ciudadano
npm install
```

### 2. Configurar Firebase

Edita `src/config/firebase.js` y reemplaza los valores con los de tu proyecto:

```js
const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT_ID.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId:             "TU_APP_ID",
}
```

Encuentra estos valores en:  
`Firebase Console → Project Settings → General → Your apps → Web app`

### 3. Configurar municipio

Edita `src/config/municipios.js` para ajustar:
- Coordenadas del mapa (`mapCenter`, `mapZoom`)
- Color de marca (`brandColor`)
- Nombre y estado del municipio

### 4. Crear usuarios administradores

Sigue las instrucciones en `crear_usuarios.js`.

### 5. Instalar leaflet.heat

```bash
npm install leaflet.heat
```

> **Nota:** leaflet.heat no tiene tipos TypeScript. Si hay errores de importación,
> añade `// @ts-ignore` antes del import en Mapa.jsx.

### 6. Correr en desarrollo

```bash
npm run dev
```

El panel estará disponible en `http://localhost:5173`

---

## Estructura del proyecto

```
src/
├── config/
│   ├── firebase.js        ← Credenciales Firebase (EDITAR)
│   ├── municipios.js      ← Config multi-municipio
│   └── categorias.js      ← Categorías, colores, orden de prioridad
├── contexts/
│   ├── AuthContext.jsx    ← Autenticación Firebase + roles
│   └── MunicipioContext.jsx ← Municipio activo + tema MUI
├── theme/
│   └── index.js           ← Tema MUI Berry-style
├── hooks/
│   └── useReportes.js     ← Consultas reactivas a Firestore
├── layouts/
│   └── MainLayout.jsx     ← Sidebar + AppBar
├── pages/
│   ├── Login.jsx          ← Pantalla de login
│   ├── Dashboard.jsx      ← Métricas y gráficas históricas
│   ├── Mapa.jsx           ← Mapa geográfico + mapa de calor
│   └── Gestion.jsx        ← Gestión del ciclo de vida
└── components/
    ├── ui/
    │   ├── StatCard.jsx       ← Tarjeta de métrica
    │   ├── FiltroTemporal.jsx ← Selector Día/Semana/Mes/Año
    │   └── ProtectedRoute.jsx ← Rutas protegidas por rol
    └── charts/
        ├── PieCategoria.jsx   ← Donut por categoría
        └── BarTemporal.jsx    ← Barras por día
```

---

## Roles de usuario

| Rol | Dashboard | Mapa | Gestión |
|-----|-----------|------|---------|
| `visor` | ✅ | ✅ | ❌ |
| `operador` | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ |

Los roles se configuran en Firestore en la colección `usuarios/{uid}.rol`.

---

## Despliegue en Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar (selecciona Hosting)
firebase init hosting
# → Public directory: dist
# → Single-page app: Yes
# → Overwrite index.html: No

# Build y deploy
npm run build
firebase deploy
```

---

## Agregar un nuevo municipio

1. Agrega una entrada en `src/config/municipios.js`
2. Crea la colección en Firestore (ej. `reportes_zapopan`)
3. En el login, los usuarios del nuevo municipio verán su propio municipio
   basado en el campo `municipio` de su perfil en Firestore

---

## Conexión con el bot (n8n)

El panel lee directamente de las mismas colecciones que escribe el bot:
- `reportes` → historial de reportes (escrito por n8n, leído por el panel)
- `conversaciones` → estado del chat (solo el bot escribe)

Los reportes se actualizan en tiempo real usando `onSnapshot` de Firestore.
Cualquier cambio de estatus hecho desde el panel es inmediatamente visible.
# reporte-ciudadano-admin
