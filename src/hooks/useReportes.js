// src/hooks/useReportes.js
import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, doc, updateDoc, Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { subDays } from 'date-fns'

// Filtros temporales predefinidos
export const FILTROS_TIEMPO = {
  dia:    { label: 'Hoy',        dias: 1   },
  semana: { label: 'Esta semana', dias: 7  },
  mes:    { label: 'Este mes',   dias: 30  },
  anio:   { label: 'Este año',   dias: 365 },
  todos:  { label: 'Todos',      dias: null },
}

export function useReportes(filtroTiempo = 'mes') {
  const { municipio } = useMunicipio()
  const [reportes,  setReportes]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null) // CORREGIDO: Definición de estado de error

  useEffect(() => {
    // Si no hay municipio o colección, no ejecutamos la consulta
    if (!municipio?.coleccionReportes) {
      setLoading(false)
      return
    }

    setLoading(true)
    const colRef = collection(db, municipio.coleccionReportes)
    let constraints = []

    // ── Lógica de Filtro Temporal ──
    if (filtroTiempo !== 'todos' && FILTROS_TIEMPO[filtroTiempo]) {
      const { dias } = FILTROS_TIEMPO[filtroTiempo]
      const fechaLimite = subDays(new Date(), dias)
      const desde = Timestamp.fromDate(fechaLimite)
      
      // REGLA FIRESTORE: El campo en el 'where' de rango debe ser el mismo que el primer 'orderBy'
      constraints.push(where('fecha_iso', '>=', desde))
    }

    // Ordenamos por fecha descendente (más nuevos primero)
    constraints.push(orderBy('fecha_iso', 'desc'))

    const q = query(colRef, ...constraints)

    // Escucha en tiempo real
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map(d => {
          const data = d.data()
          // Normalización segura de la fecha para evitar errores en componentes
          let fechaNormalizada = new Date()
          if (data.fecha_iso?.toDate) {
            fechaNormalizada = data.fecha_iso.toDate()
          } else if (data.fecha_iso instanceof Date) {
            fechaNormalizada = data.fecha_iso
          } else if (typeof data.fecha_iso === 'string') {
            fechaNormalizada = new Date(data.fecha_iso)
          }

          return {
            id: d.id,
            ...data,
            fecha: fechaNormalizada,
          }
        })
        
        setReportes(docs)
        setError(null)
        setLoading(false)
      },
      (err) => {
        // IMPORTANTE: Si ves un error aquí en la consola, haz clic en el link de Firebase para crear el índice.
        console.error('Error en el Hook useReportes:', err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [municipio?.coleccionReportes, filtroTiempo])

  // Función para actualizar reportes (se mantiene igual)
  const actualizarReporte = useCallback(async (id, cambios) => {
    if (!municipio?.coleccionReportes) return
    const ref = doc(db, municipio.coleccionReportes, id)
    await updateDoc(ref, {
      ...cambios,
      fecha_actualizacion: Timestamp.now(),
    })
  }, [municipio?.coleccionReportes])

  // Estadísticas calculadas del conjunto actual (Memoizado)
  const stats = useCallback(() => {
    const data = {
      total: reportes.length,
      porCategoria: {},
      porEstatus: {}
    }

    reportes.forEach(r => {
      const cat = r.categoria || 'Otro'
      data.porCategoria[cat] = (data.porCategoria[cat] || 0) + 1
      
      const est = r.estatus || 'Nuevo'
      data.porEstatus[est] = (data.porEstatus[est] || 0) + 1
    })

    return data
  }, [reportes])

  // Filtro de reportes con ubicación para el mapa
  const reportesConUbicacion = (reportes || []).filter(
    r => r.lat && r.lon && r.lat !== '' && r.lon !== ''
  )

  return {
    reportes,
    reportesConUbicacion,
    loading,
    error, // CORREGIDO: Variable ahora disponible para el Dashboard
    actualizarReporte,
    stats,
  }
}