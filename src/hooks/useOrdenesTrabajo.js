// src/hooks/useOrdenesTrabajo.js
// ─────────────────────────────────────────────────────────────
// Extiende la lógica de reportes con operaciones propias del
// sistema de tickets: asignación, notas, cambio de prioridad
// y un historial de actividad por reporte.
//
// Los datos viven en los mismos documentos de la colección
// "reportes" — no se crea una colección separada.
// ─────────────────────────────────────────────────────────────
import { useCallback } from 'react'
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { useAuth } from '@/contexts/AuthContext'
import { useReportes } from '@/hooks/useReportes'

export const PRIORIDADES = [
  { value: 'alta',  label: 'Alta',  color: '#DC2626', bg: '#FEE2E2', orden: 1 },
  { value: 'media', label: 'Media', color: '#D97706', bg: '#FEF3C7', orden: 2 },
  { value: 'baja',  label: 'Baja',  color: '#059669', bg: '#D1FAE5', orden: 3 },
]
export const PRIORIDAD_MAP = Object.fromEntries(PRIORIDADES.map(p => [p.value, p]))

// Columnas del kanban con los estatus que agrupa cada una
export const COLUMNAS_KANBAN = [
  {
    id:       'nuevo',
    label:    'Nuevos',
    estatus:  ['Nuevo'],
    color:    '#3B82F6',
    bg:       '#EFF6FF',
  },
  {
    id:       'en_proceso',
    label:    'En proceso',
    estatus:  ['En proceso'],
    color:    '#D97706',
    bg:       '#FFFBEB',
  },
  {
    id:       'resuelto',
    label:    'Resueltos / Cerrados',
    estatus:  ['Resuelto', 'No aplica', 'Rechazado'],
    color:    '#059669',
    bg:       '#F0FDF4',
  },
]

// ── Helper: crear entrada de actividad ───────────────────────
function entradaActividad(texto, autorNombre, tipo = 'nota') {
  return {
    texto,
    autorNombre,
    tipo,       // 'nota' | 'estatus' | 'asignacion' | 'prioridad'
    fecha: Timestamp.now(),
  }
}

export function useOrdenesTrabajo(filtroTiempo = 'todos') {
  const { municipio }             = useMunicipio()
  const { user, perfil }          = useAuth()
  const { reportes, reportesConUbicacion, loading, error } = useReportes(filtroTiempo)

  const col = municipio?.coleccionReportes

  // ── Agregar nota al historial de actividad ────────────────
  const agregarNota = useCallback(async (reporteId, texto) => {
    if (!col || !texto?.trim()) return
    const nombre = perfil?.nombre ?? user?.email ?? 'Operador'
    await updateDoc(doc(db, col, reporteId), {
      actividad: arrayUnion(entradaActividad(texto.trim(), nombre, 'nota')),
      fecha_actualizacion: Timestamp.now(),
    })
  }, [col, perfil, user])

  // ── Cambiar estatus + registrar en actividad ──────────────
  const cambiarEstatus = useCallback(async (reporteId, nuevoEstatus, reporteActual) => {
    if (!col) return
    const nombre    = perfil?.nombre ?? user?.email ?? 'Operador'
    const anterior  = reporteActual?.estatus ?? 'Nuevo'
    const texto     = `Estatus cambiado de "${anterior}" a "${nuevoEstatus}"`
    const cambios   = {
      estatus:  nuevoEstatus,
      actividad: arrayUnion(entradaActividad(texto, nombre, 'estatus')),
      fecha_actualizacion: Timestamp.now(),
    }
    // Si se resuelve, registrar quién lo cerró y cuándo
    if (nuevoEstatus === 'Resuelto') {
      cambios.atendido_por      = nombre
      cambios.fecha_resolucion  = new Date().toISOString().slice(0, 10)
    }
    await updateDoc(doc(db, col, reporteId), cambios)
  }, [col, perfil, user])

  // ── Cambiar prioridad ─────────────────────────────────────
  const cambiarPrioridad = useCallback(async (reporteId, nuevaPrioridad) => {
    if (!col) return
    const nombre = perfil?.nombre ?? user?.email ?? 'Operador'
    const texto  = `Prioridad establecida como "${PRIORIDAD_MAP[nuevaPrioridad]?.label ?? nuevaPrioridad}"`
    await updateDoc(doc(db, col, reporteId), {
      prioridad: nuevaPrioridad,
      actividad: arrayUnion(entradaActividad(texto, nombre, 'prioridad')),
      fecha_actualizacion: Timestamp.now(),
    })
  }, [col, perfil, user])

  // ── Asignar a operador ────────────────────────────────────
  const asignarReporte = useCallback(async (reporteId, operadorUid, operadorNombre) => {
    if (!col) return
    const asignadorNombre = perfil?.nombre ?? user?.email ?? 'Admin'
    const texto = operadorUid
      ? `Asignado a ${operadorNombre}`
      : 'Asignación removida'
    await updateDoc(doc(db, col, reporteId), {
      asignado_a:      operadorUid     ?? '',
      asignado_nombre: operadorNombre  ?? '',
      actividad: arrayUnion(entradaActividad(texto, asignadorNombre, 'asignacion')),
      fecha_actualizacion: Timestamp.now(),
    })
  }, [col, perfil, user])

  // ── Filtrar por columna kanban ────────────────────────────
  const reportesPorColumna = useCallback((columnaId, soloMios = false) => {
    const col = COLUMNAS_KANBAN.find(c => c.id === columnaId)
    if (!col) return []
    let lista = reportes.filter(r => col.estatus.includes(r.estatus ?? 'Nuevo'))
    if (soloMios) lista = lista.filter(r => r.asignado_a === user?.uid)
    return lista
  }, [reportes, user])

  return {
    reportes,
    reportesConUbicacion,
    loading,
    error,
    // Operaciones de ticket
    agregarNota,
    cambiarEstatus,
    cambiarPrioridad,
    asignarReporte,
    reportesPorColumna,
  }
}
