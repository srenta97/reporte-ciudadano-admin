// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'

const AuthContext = createContext(null)

// Roles disponibles en el sistema
// - 'admin'    → acceso completo
// - 'operador' → gestión de reportes asignados
// - 'visor'    → solo lectura (dashboard y mapa)
// El rol se guarda en Firestore en la colección 'usuarios/{uid}'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [perfil,  setPerfil]  = useState(null)  // datos extra de Firestore
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Cargar perfil con rol y municipio asignado
        try {
          const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
          setPerfil(snap.exists() ? snap.data() : { rol: 'visor', municipio: 'juchitlan' })
        } catch {
          setPerfil({ rol: 'visor', municipio: 'juchitlan' })
        }
      } else {
        setUser(null)
        setPerfil(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  const esAdmin    = perfil?.rol === 'admin'
  const esOperador = perfil?.rol === 'admin' || perfil?.rol === 'operador'

  return (
    <AuthContext.Provider value={{
      user, perfil, loading,
      login, logout,
      esAdmin, esOperador,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
