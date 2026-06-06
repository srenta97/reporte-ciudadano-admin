// src/hooks/useUsuarios.js
import { useState, useEffect, useCallback } from 'react'
import {
  obtenerUsuarios, crearUsuario, actualizarUsuario,
  desactivarUsuario, reactivarUsuario, eliminarUsuario,
} from '@/services/usuariosService'

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerUsuarios()
      setUsuarios(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const crear = useCallback(async (datos) => {
    const uid = await crearUsuario(datos)
    await cargar()
    return uid
  }, [cargar])

  const actualizar = useCallback(async (uid, cambios) => {
    await actualizarUsuario(uid, cambios)
    await cargar()
  }, [cargar])

  const desactivar = useCallback(async (uid) => {
    await desactivarUsuario(uid)
    await cargar()
  }, [cargar])

  const reactivar = useCallback(async (uid) => {
    await reactivarUsuario(uid)
    await cargar()
  }, [cargar])

  const eliminar = useCallback(async (uid) => {
    await eliminarUsuario(uid)
    await cargar()
  }, [cargar])

  return { usuarios, loading, error, cargar, crear, actualizar, desactivar, reactivar, eliminar }
}
