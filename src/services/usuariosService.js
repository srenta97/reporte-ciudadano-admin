// src/services/usuariosService.js
// ─────────────────────────────────────────────────────────────
// Operaciones CRUD de usuarios.
//
// PROBLEMA: createUserWithEmailAndPassword() de Firebase SDK
// hace login automático del nuevo usuario, cerrando la sesión
// del admin que está operando el panel.
//
// SOLUCIÓN: Usar la Firebase Auth REST API directamente.
// El endpoint /accounts:signUp con el Web API Key crea la
// cuenta sin afectar la sesión del cliente actual.
// ─────────────────────────────────────────────────────────────

import {
  doc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, getDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

// Lee el apiKey desde las variables de entorno de Vite.
// En producción define VITE_FIREBASE_API_KEY en tu .env
// (misma clave que firebaseConfig.apiKey — es pública por diseño).
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY

// ── Crear usuario (Auth REST + perfil Firestore) ──────────────
export async function crearUsuario({ email, password, nombre, rol, municipio }) {
  // 1. Crear cuenta en Firebase Auth sin afectar sesión actual
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    }
  )
  const data = await res.json()
  if (!res.ok) {
    const msg = data.error?.message ?? 'Error al crear usuario'
    throw new Error(
      msg === 'EMAIL_EXISTS'        ? 'Este correo ya está registrado.'      :
      msg === 'WEAK_PASSWORD'       ? 'La contraseña debe tener al menos 6 caracteres.' :
      msg === 'INVALID_EMAIL'       ? 'El correo no tiene un formato válido.' :
      msg
    )
  }

  const uid = data.localId

  // 2. Guardar perfil en Firestore colección "usuarios"
  await setDoc(doc(db, 'usuarios', uid), {
    uid,
    nombre,
    email,
    rol,       // 'admin' | 'operador' | 'visor'
    municipio,
    activo: true,
    creado: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  })

  return uid
}

// ── Leer todos los usuarios ───────────────────────────────────
export async function obtenerUsuarios() {
  const q    = query(collection(db, 'usuarios'), orderBy('creado', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Actualizar perfil (rol, nombre, activo) ───────────────────
// Nota: cambiar el email/contraseña requiere Admin SDK (Cloud Function).
// Para este MVP actualizamos solo los campos del perfil en Firestore.
export async function actualizarUsuario(uid, cambios) {
  await updateDoc(doc(db, 'usuarios', uid), {
    ...cambios,
    actualizadoEn: serverTimestamp(),
  })
}

// ── Desactivar usuario (soft delete) ─────────────────────────
// No borra la cuenta de Auth — solo marca activo: false.
// El usuario sigue existiendo pero ProtectedRoute lo rechaza
// si se agrega la comprobación de perfil.activo.
export async function desactivarUsuario(uid) {
  await updateDoc(doc(db, 'usuarios', uid), {
    activo: false,
    actualizadoEn: serverTimestamp(),
  })
}

// ── Reactivar usuario ─────────────────────────────────────────
export async function reactivarUsuario(uid) {
  await updateDoc(doc(db, 'usuarios', uid), {
    activo: true,
    actualizadoEn: serverTimestamp(),
  })
}

// ── Eliminar permanentemente ──────────────────────────────────
// Borra el perfil de Firestore. La cuenta de Auth permanece
// (eliminarla requiere Admin SDK). El usuario no podrá acceder
// porque ProtectedRoute verifica que exista el perfil.
export async function eliminarUsuario(uid) {
  await deleteDoc(doc(db, 'usuarios', uid))
}
