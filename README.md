# Reporte Ciudadano — Panel Administrativo

Sistema de administración web para el chatbot de reportes ciudadanos del Municipio de Juchitlán.

Construido con **React + Vite + Tailwind CSS + MUI (Berry style)** y **Firebase**.

**Repositorio oficial:** https://github.com/srenta97/reporte-ciudadano-admin

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
| --- | --- |
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

## ⚙️ Instalación y configuración

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/srenta97/reporte-ciudadano-admin.git
cd reporte-ciudadano-admin
npm install
```

> Si ya tienes el repositorio clonado en una carpeta llamada `reporte-ciudadano`, puedes entrar directamente a esa carpeta y ejecutar `npm install`.

### 2. Configurar Firebase

Edita `src/config/firebase.js` y reemplaza los valores con los de tu proyecto:

```javascript
const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT_ID.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId:             "TU_APP_ID",
}
```

Puedes encontrar estos valores en:

`Firebase Console → Project Settings → General → Your apps → Web app`

> ⚠️ **Importante:** revisa y configura correctamente los permisos y reglas de seguridad en la consola de Firebase: https://firebase.google.com/

### 3. Configurar municipio

Edita `src/config/municipios.js` para ajustar:

- Coordenadas del mapa (`mapCenter`, `mapZoom`).
- Color de marca (`brandColor`).
- Nombre del municipio.
- Estado del municipio.

### 4. Crear usuarios administradores

Sigue las instrucciones en `crear_usuarios.js`.

### 5. Instalar `leaflet.heat`

```bash
npm install leaflet.heat
```

> **Nota:** `leaflet.heat` no tiene tipos TypeScript. Si aparecen errores de importación, añade `// @ts-ignore` antes del import correspondiente en `Mapa.jsx`.

---

## 🚀 Correr el entorno localmente

### Panel web

Ejecuta:

```bash
npm run dev
```

El panel estará disponible en:

```text
http://localhost:5173
```

### Chatbot con n8n

En una terminal separada:

```bash
n8n start
```

### Túnel para webhooks con Ngrok

En otra terminal, expón el puerto `5678` de n8n para que pueda comunicarse con servicios externos:

```bash
ngrok http --domain=nonschematically-unmonetary-princess.ngrok-free.dev 5678
```

> El panel, n8n y Ngrok deben ejecutarse en terminales separadas durante el desarrollo local.

---

## 🤖 Conexión con el bot (n8n)

El panel lee directamente de las mismas colecciones que escribe el bot en Firebase:

- `reportes` → historial de reportes, escrito por n8n y leído por el panel.
- `conversaciones` → estado del chat, escrito por el bot.

Los reportes se actualizan en tiempo real utilizando `onSnapshot` de Firestore.

Cualquier cambio de estatus realizado desde el panel es inmediatamente visible en los datos sincronizados.

---

## 📁 Estructura del proyecto

```text
src/
├── config/
│   ├── firebase.js          ← Credenciales Firebase (EDITAR)
│   ├── municipios.js        ← Configuración multi-municipio
│   └── categorias.js        ← Categorías, colores y orden de prioridad
├── contexts/
│   ├── AuthContext.jsx      ← Autenticación Firebase + roles
│   └── MunicipioContext.jsx ← Municipio activo + tema MUI
├── theme/
│   └── index.js             ← Tema MUI Berry-style
├── hooks/
│   └── useReportes.js       ← Consultas reactivas a Firestore
├── layouts/
│   └── MainLayout.jsx       ← Sidebar + AppBar
├── pages/
│   ├── Login.jsx            ← Pantalla de login
│   ├── Dashboard.jsx        ← Métricas y gráficas históricas
│   ├── Mapa.jsx             ← Mapa geográfico + mapa de calor
│   └── Gestion.jsx          ← Gestión del ciclo de vida
└── components/
    ├── ui/
    │   ├── StatCard.jsx        ← Tarjeta de métrica
    │   ├── FiltroTemporal.jsx  ← Selector Día/Semana/Mes/Año
    │   └── ProtectedRoute.jsx  ← Rutas protegidas por rol
    └── charts/
        ├── PieCategoria.jsx    ← Donut por categoría
        └── BarTemporal.jsx     ← Barras por día
```

---

## 👥 Roles de usuario

Los roles se configuran en Firestore en la colección:

```text
usuarios/{uid}.rol
```

| Rol | Dashboard | Mapa | Gestión |
| --- | :---: | :---: | :---: |
| `visor` | ✅ | ✅ | ❌ |
| `operador` | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ |

---

## 🏘️ Agregar un nuevo municipio

Para incorporar un nuevo municipio:

1. Agrega una nueva entrada en `src/config/municipios.js`.
2. Configura sus coordenadas, nivel de zoom, color de marca, nombre y estado.
3. Crea/configura las colecciones de Firestore que correspondan al municipio.
   - Ejemplo: `reportes_zapopan`.
4. Configura el perfil de los usuarios con el campo `municipio` en Firestore.
5. Al iniciar sesión, los usuarios del nuevo municipio podrán trabajar con la configuración correspondiente a su municipio.

> La estructura exacta de las colecciones debe mantenerse alineada con la configuración y los flujos de datos utilizados por el bot.

---

## ☁️ Despliegue en Firebase Hosting

### Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### Iniciar sesión

```bash
firebase login
```

### Inicializar Firebase Hosting

```bash
firebase init hosting
```

Durante la configuración selecciona:

```text
Public directory: dist
Single-page app: Yes
Overwrite index.html: No
```

### Build y deploy

```bash
npm run build
firebase deploy
```

---

## 📌 Resumen de operación

El sistema está compuesto por:

1. **Panel administrativo:** aplicación React/Vite para consultar y gestionar reportes.
2. **Firebase Authentication:** autenticación y control de acceso mediante roles.
3. **Firestore:** almacenamiento de reportes, conversaciones y perfiles, con sincronización en tiempo real.
4. **Firebase Storage:** almacenamiento de archivos asociado al sistema.
5. **n8n:** ejecución del chatbot y escritura de datos en Firebase.
6. **Ngrok:** exposición del puerto de n8n para webhooks durante el desarrollo local.
7. **Leaflet/OpenStreetMap:** visualización geográfica de los reportes.
8. **Chart.js:** visualización de métricas y datos históricos.

---

## 🔐 Seguridad

No publiques credenciales privadas, tokens, claves de servicio ni archivos sensibles en el repositorio.

La configuración de Firebase del frontend debe complementarse con reglas adecuadas de **Firestore**, **Storage** y **Authentication**.

Antes de desplegar a producción, verifica especialmente:

- Reglas de acceso por rol.
- Permisos de lectura y escritura de `reportes`.
- Permisos de acceso a `conversaciones`.
- Acceso a los perfiles de `usuarios`.
- Reglas de Firebase Storage.
- Configuración de dominios autorizados en Firebase Authentication.
