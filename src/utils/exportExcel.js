// src/utils/exportExcel.js
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CATEGORIAS } from '@/config/categorias'
import { PRIORIDAD_MAP } from '@/hooks/useOrdenesTrabajo'

function safeDate(r, onlyDate = false) {
  try {
    const d = r.fecha instanceof Date ? r.fecha : (r.fecha_iso?.toDate ? r.fecha_iso.toDate() : new Date(r.fecha_iso))
    return format(d, onlyDate ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm', { locale: es })
  } catch { return r.fecha_legible ?? '' }
}

function descargarExcel(wb, nombre) {
  XLSX.writeFile(wb, `${nombre}_${format(new Date(),'yyyyMMdd_HHmm')}.xlsx`)
}

function descargarCSV(ws, nombre) {
  const csv  = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${nombre}_${format(new Date(),'yyyyMMdd_HHmm')}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function aplicarEstilos(ws) {
  const ref  = XLSX.utils.decode_range(ws['!ref'])
  const cols = []
  for (let c = ref.s.c; c <= ref.e.c; c++) {
    let max = 10
    for (let r = ref.s.r; r <= ref.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (cell && cell.v) max = Math.max(max, String(cell.v).length + 2)
    }
    cols.push({ wch: Math.min(max, 50) })
  }
  ws['!cols'] = cols
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
}

// ── 1. Excel completo — ACTUALIZADO: +Prioridad, +Asignado a,
//       +actividad_notas, +dias_abierto en hoja principal.
//       Nueva hoja "Órdenes activas" con datos de seguimiento.
export function exportarExcelCompleto(reportes, municipio) {
  const wb = XLSX.utils.book_new()

  // Hoja 1: Detalle completo
  const headers = [
    'Folio','Categoría','Subtipo',
    'Prioridad','Asignado a',           // NUEVO
    'Ubicación','Latitud','Longitud',
    'Fecha','Hora','Estatus',
    'Notas (actividad)',                 // NUEVO
    'Días abierto',                      // NUEVO
    'Tiene foto','Foto URL','Teléfono',
    'Atendido por','Notas internas','Fecha resolución','Municipio',
  ]
  const hoy = Date.now()
  const rows = reportes.map(r => {
    const dias = r.fecha
      ? Math.floor((hoy - new Date(r.fecha).getTime()) / 86400000)
      : ''
    const notasCount = (r.actividad ?? []).filter(a => a.tipo === 'nota').length
    return [
      r.folio ?? '',
      r.categoria ?? '',
      r.subtipo ?? '',
      r.prioridad ? (PRIORIDAD_MAP[r.prioridad]?.label ?? r.prioridad) : '',
      r.asignado_nombre ?? '',
      r.ubicacion ?? '',
      r.lat ?? '',
      r.lon ?? '',
      safeDate(r, true),
      r.hora ?? '',
      r.estatus ?? 'Nuevo',
      notasCount || '',
      dias !== '' ? dias : '',
      r.tiene_foto === 'si' ? 'Sí' : 'No',
      r.foto_url ?? '',
      r.telefono ?? '',
      r.atendido_por ?? '',
      r.notas_internas ?? '',
      r.fecha_resolucion ?? '',
      municipio?.nombre ?? '',
    ]
  })

  const ws1 = XLSX.utils.aoa_to_sheet([headers, ...rows])
  aplicarEstilos(ws1)
  XLSX.utils.book_append_sheet(wb, ws1, 'Reportes')

  // Hoja 2: Resumen por categoría
  const total = reportes.length
  const resRows = CATEGORIAS.map(cat => {
    const lista     = reportes.filter(r => r.categoria === cat.firestoreValue)
    const cantidad  = lista.length
    const conFoto   = lista.filter(r => r.tiene_foto === 'si').length
    const resueltos = lista.filter(r => r.estatus === 'Resuelto').length
    return [
      `${cat.emoji} ${cat.label}`, cantidad,
      total > 0 ? `${((cantidad/total)*100).toFixed(1)}%` : '0%',
      conFoto, resueltos,
    ]
  }).filter(r => r[1] > 0)

  const ws2 = XLSX.utils.aoa_to_sheet([
    ['Categoría','Cantidad','% del total','Con foto','Resueltos'],
    ...resRows,
  ])
  aplicarEstilos(ws2)
  XLSX.utils.book_append_sheet(wb, ws2, 'Por categoría')

  // Hoja 3: Por estatus
  const estatusMap = {}
  reportes.forEach(r => { const e = r.estatus ?? 'Nuevo'; estatusMap[e] = (estatusMap[e] ?? 0) + 1 })
  const ws3 = XLSX.utils.aoa_to_sheet([
    ['Estatus','Cantidad','% del total'],
    ...Object.entries(estatusMap).map(([k,v]) => [k, v, `${((v/total)*100).toFixed(1)}%`]),
  ])
  aplicarEstilos(ws3)
  XLSX.utils.book_append_sheet(wb, ws3, 'Por estatus')

  // Hoja 4: NUEVA — Órdenes activas (para operadores)
  const activos = reportes.filter(r => !['Resuelto','No aplica','Rechazado'].includes(r.estatus ?? 'Nuevo'))
  const ws4 = XLSX.utils.aoa_to_sheet([
    ['Folio','Categoría','Prioridad','Estatus','Asignado a','Días abierto','Notas','Ubicación','Teléfono'],
    ...activos
      .sort((a, b) => {
        const orden = { alta: 1, media: 2, baja: 3 }
        return (orden[a.prioridad] ?? 4) - (orden[b.prioridad] ?? 4)
      })
      .map(r => {
        const dias  = r.fecha ? Math.floor((hoy - new Date(r.fecha).getTime()) / 86400000) : ''
        const notas = (r.actividad ?? []).filter(a => a.tipo === 'nota').length
        return [
          r.folio ?? '',
          r.categoria ?? '',
          r.prioridad ? (PRIORIDAD_MAP[r.prioridad]?.label ?? r.prioridad) : '',
          r.estatus ?? 'Nuevo',
          r.asignado_nombre ?? '',
          dias,
          notas || '',
          r.ubicacion ?? '',
          r.telefono ?? '',
        ]
      }),
  ])
  aplicarEstilos(ws4)
  XLSX.utils.book_append_sheet(wb, ws4, 'Órdenes activas')

  descargarExcel(wb, 'reporte_completo')
}

// ── 2. CSV simple — ACTUALIZADO: +prioridad, +asignado_a ─────
export function exportarCSV(reportes, municipio) {
  const headers = [
    'folio','categoria','subtipo',
    'prioridad','asignado_a',
    'ubicacion','latitud','longitud',
    'fecha','hora','estatus',
    'tiene_foto','telefono',
    'atendido_por','notas_internas','fecha_resolucion',
  ]
  const rows = reportes.map(r => [
    r.folio ?? '',
    r.categoria ?? '',
    r.subtipo ?? '',
    r.prioridad ?? '',
    r.asignado_nombre ?? '',
    r.ubicacion ?? '',
    r.lat ?? '',
    r.lon ?? '',
    safeDate(r, true),
    r.hora ?? '',
    r.estatus ?? 'Nuevo',
    r.tiene_foto === 'si' ? 'si' : 'no',
    r.telefono ?? '',
    r.atendido_por ?? '',
    r.notas_internas ?? '',
    r.fecha_resolucion ?? '',
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  descargarCSV(ws, 'reportes')
}

// ── 3. Pendientes — ACTUALIZADO: +Prioridad, +Asignado a ─────
export function exportarExcelPendientes(reportes, municipio) {
  const pendientes = reportes
    .filter(r => ['Nuevo','En proceso'].includes(r.estatus ?? 'Nuevo'))
    .sort((a, b) => {
      const orden = { alta: 1, media: 2, baja: 3 }
      return (orden[a.prioridad] ?? 4) - (orden[b.prioridad] ?? 4)
    })

  const wb = XLSX.utils.book_new()
  const hoy = Date.now()
  const headers = ['Folio','Prioridad','Días abierto','Categoría','Estatus','Asignado a','Ubicación','Teléfono','Fecha reporte']
  const rows = pendientes.map(r => {
    const dias = r.fecha ? Math.floor((hoy - new Date(r.fecha).getTime()) / 86400000) : ''
    return [
      r.folio ?? '',
      r.prioridad ? (PRIORIDAD_MAP[r.prioridad]?.label ?? r.prioridad) : '',
      dias,
      r.categoria ?? '',
      r.estatus ?? 'Nuevo',
      r.asignado_nombre ?? '',
      r.ubicacion ?? '',
      r.telefono ?? '',
      safeDate(r),
    ]
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  aplicarEstilos(ws)
  XLSX.utils.book_append_sheet(wb, ws, 'Pendientes')
  descargarExcel(wb, 'pendientes')
}

// ── 4. Mensual — ACTUALIZADO: +Prioridad, +Asignado a ────────
export function exportarExcelMensual(reportes, anio, mes, municipio) {
  const nombreMes = format(new Date(anio, mes - 1, 1), 'MMMM', { locale: es })
  const wb = XLSX.utils.book_new()

  const headers = ['Folio','Categoría','Prioridad','Fecha','Estatus','Asignado a','Ubicación','Atendido por','Notas']
  const rows = reportes.map(r => [
    r.folio ?? '',
    r.categoria ?? '',
    r.prioridad ? (PRIORIDAD_MAP[r.prioridad]?.label ?? r.prioridad) : '',
    safeDate(r),
    r.estatus ?? 'Nuevo',
    r.asignado_nombre ?? '',
    r.ubicacion ?? '',
    r.atendido_por ?? '',
    r.notas_internas ?? '',
  ])

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  aplicarEstilos(ws)
  XLSX.utils.book_append_sheet(wb, ws, `${nombreMes} ${anio}`)
  descargarExcel(wb, `informe_${anio}_${String(mes).padStart(2,'0')}`)
}

// ── 5. NUEVA: Excel de órdenes de trabajo con actividad ───────
// Dos hojas: resumen de órdenes activas + detalle de actividad.
export function exportarExcelOrdenes(reportes, municipio) {
  const activos = reportes.filter(r =>
    !['Resuelto','No aplica','Rechazado'].includes(r.estatus ?? 'Nuevo')
  )
  const hoy = Date.now()
  const wb  = XLSX.utils.book_new()

  // Hoja 1: Órdenes activas
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['Folio','Categoría','Prioridad','Estatus','Asignado a','Días abierto','# Notas','Ubicación','Teléfono','Fecha apertura'],
    ...activos
      .sort((a, b) => {
        const orden = { alta: 1, media: 2, baja: 3 }
        return (orden[a.prioridad] ?? 4) - (orden[b.prioridad] ?? 4)
      })
      .map(r => {
        const dias  = r.fecha ? Math.floor((hoy - new Date(r.fecha).getTime()) / 86400000) : ''
        const notas = (r.actividad ?? []).filter(a => a.tipo === 'nota').length
        return [
          r.folio ?? '',
          r.categoria ?? '',
          r.prioridad ? (PRIORIDAD_MAP[r.prioridad]?.label ?? r.prioridad) : '',
          r.estatus ?? 'Nuevo',
          r.asignado_nombre ?? '',
          dias,
          notas || '',
          r.ubicacion ?? '',
          r.telefono ?? '',
          safeDate(r),
        ]
      }),
  ])
  aplicarEstilos(ws1)
  XLSX.utils.book_append_sheet(wb, ws1, 'Órdenes activas')

  // Hoja 2: Historial de actividad completo
  const actividadRows = []
  activos.forEach(r => {
    const actividad = [...(r.actividad ?? [])].sort((a, b) => {
      const ta = a.fecha?.toDate?.()?.getTime() ?? 0
      const tb = b.fecha?.toDate?.()?.getTime() ?? 0
      return ta - tb
    })
    actividad.forEach(a => {
      let fecha = ''
      try {
        const d = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
        fecha = format(d, 'dd/MM/yyyy HH:mm', { locale: es })
      } catch {}
      actividadRows.push([
        r.folio ?? '',
        r.categoria ?? '',
        fecha,
        a.tipo ?? 'nota',
        a.autorNombre ?? '',
        a.texto ?? '',
      ])
    })
  })

  const ws2 = XLSX.utils.aoa_to_sheet([
    ['Folio','Categoría','Fecha y hora','Tipo de entrada','Autor','Descripción'],
    ...actividadRows,
  ])
  aplicarEstilos(ws2)
  XLSX.utils.book_append_sheet(wb, ws2, 'Historial actividad')

  descargarExcel(wb, 'ordenes_trabajo')
}
