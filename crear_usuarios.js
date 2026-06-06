// INSTRUCCIONES PARA CREAR USUARIOS EN FIREBASE
// ════════════════════════════════════════════════════════════
// Ejecuta este script UNA SOLA VEZ desde la consola del navegador
// en firebase.google.com, o desde Node.js con el Admin SDK.
// ════════════════════════════════════════════════════════════


// ── OPCIÓN 1: Crear usuario desde Firebase Console (recomendado) ──
// 
// 1. Ve a Firebase Console → Authentication → Users → Add user
// 2. Ingresa email y contraseña del funcionario
// 3. Copia el UID generado
// 4. Ve a Firestore → Colección "usuarios" → Add document
//    - Document ID: el UID del usuario
//    - Campos:
//      nombre:    string  → "Juan Pérez"
//      email:     string  → "juan@juchitlan.gob.mx"
//      rol:       string  → "admin" | "operador" | "visor"
//      municipio: string  → "juchitlan"
//      activo:    boolean → true


// ── OPCIÓN 2: Script Node.js con Admin SDK ────────────────────────
//
// npm install firebase-admin
// Descarga serviceAccountKey.json desde:
//   Firebase Console → Project Settings → Service accounts → Generate new private key

/*
const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const auth = admin.auth()
const db   = admin.firestore()

async function crearUsuario(email, password, nombre, rol, municipio) {
  // Crear en Authentication
  const userRecord = await auth.createUser({ email, password, displayName: nombre })
  
  // Crear perfil en Firestore
  await db.collection('usuarios').doc(userRecord.uid).set({
    nombre,
    email,
    rol,         // 'admin' | 'operador' | 'visor'
    municipio,   // slug del municipio: 'juchitlan'
    activo: true,
    creado: admin.firestore.FieldValue.serverTimestamp(),
  })
  
  console.log(`✅ Usuario creado: ${email} (${rol}) → UID: ${userRecord.uid}`)
  return userRecord.uid
}

// Crear usuarios de ejemplo
async function main() {
  await crearUsuario(
    'admin@juchitlan.gob.mx',
    'Contraseña123!',
    'Administrador',
    'admin',
    'juchitlan'
  )
  
  await crearUsuario(
    'operador@juchitlan.gob.mx',
    'Contraseña456!',
    'Servicios Públicos',
    'operador',
    'juchitlan'
  )
  
  process.exit(0)
}

main().catch(console.error)
*/


// ── REGLAS DE FIRESTORE para producción ──────────────────────────
// Pega esto en Firebase Console → Firestore → Rules
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuarios: solo el propio usuario puede leer su perfil
    match /usuarios/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // Solo el admin SDK puede escribir
    }

    // Reportes: autenticados pueden leer; solo escribe el bot (vía API key)
    match /reportes/{reportId} {
      allow read: if request.auth != null;
      // Actualizar estatus/notas: solo operadores y admins
      allow update: if request.auth != null; 
      allow create, delete: if false;
    }

    // Conversaciones: solo lectura para admins
    match /conversaciones/{phone} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
*/
