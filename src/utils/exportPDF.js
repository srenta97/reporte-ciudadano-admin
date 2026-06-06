// src/utils/exportPDF.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CATEGORIA_MAP } from '@/config/categorias'
import { PRIORIDAD_MAP } from '@/hooks/useOrdenesTrabajo'

const BRAND = '#1565C0'

function hexToRgbArr(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}
function total100(n, total) {
  return total === 0 ? '0' : Math.round((n / total) * 100)
}
function safeDate(r, soloFecha = false) {
  try {
    const d = r.fecha instanceof Date ? r.fecha : new Date(r.fecha_iso)
    return format(d, soloFecha ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm', { locale: es })
  } catch { return r.fecha_legible ?? '—' }
}

function headerPDF(doc, titulo, subtitulo, municipio) {
  const [r, g, b] = hexToRgbArr(municipio?.brandColor ?? BRAND)
  doc.setFillColor(r, g, b)
  doc.rect(0, 0, 210, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 14, 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`${municipio?.nombre ?? ''}, ${municipio?.estado ?? ''}`, 210 - 14, 12, { align: 'right' })
  doc.setTextColor(80, 80, 80)
  doc.setFontSize(9)
  doc.text(subtitulo, 14, 26)
  doc.setTextColor(140, 140, 140)
  doc.setFontSize(8)
  doc.text(`Generado: ${format(new Date(), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}`, 210 - 14, 26, { align: 'right' })
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(0.4)
  doc.line(14, 30, 196, 30)
}

function footerPDF(doc, municipio) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.text(
      `Reporte Ciudadano · ${municipio?.nombre ?? ''} · Página ${i} de ${pageCount}`,
      105, 290, { align: 'center' }
    )
  }
}

// ── 1. Reporte general — ACTUALIZADO: +Prioridad, +Asignado a ──
export function exportarReporteGeneral(reportes, filtros, municipio) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const periodo = filtros.periodo ?? 'Todos los períodos'
  const cat = filtros.categoria ? `· ${filtros.categoria}` : ''
  const est = filtros.estatus   ? `· ${filtros.estatus}`   : ''

  headerPDF(doc, 'Reporte General de Incidencias',
    `${periodo} ${cat} ${est} · ${reportes.length} registros`, municipio)

  const cols = ['Folio','Categoría','Subtipo','Prioridad','Ubicación','Fecha','Estatus','Asignado a','Foto']
  const rows = reportes.map(r => [
    r.folio ?? '—',
    r.categoria ?? '—',
    r.subtipo ?? '—',
    r.prioridad ? (PRIORIDAD_MAP[r.prioridad]?.label ?? r.prioridad) : '—',
    (r.ubicacion ?? '—').slice(0, 35),
    safeDate(r),
    r.estatus ?? 'Nuevo',
    r.asignado_nombre ?? '—',
    r.tiene_foto === 'si' ? 'Sí' : 'No',
  ])

  autoTable(doc, {
    startY: 36,
    head: [cols],
    body: rows,
    styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: {
      fillColor: hexToRgbArr(municipio?.brandColor ?? BRAND),
      textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [248,250,252] },
    columnStyles: {
      0: { cellWidth: 20 }, 1: { cellWidth: 24 }, 2: { cellWidth: 22 },
      3: { cellWidth: 16 }, 4: { cellWidth: 52 }, 5: { cellWidth: 26 },
      6: { cellWidth: 20 }, 7: { cellWidth: 26 }, 8: { cellWidth: 10 },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const prio = PRIORIDAD_MAP[reportes[data.row.index]?.prioridad]
        if (prio) data.cell.styles.textColor = hexToRgbArr(prio.color)
      }
    },
  })

  footerPDF(doc, municipio)
  doc.save(`reporte_general_${format(new Date(),'yyyyMMdd_HHmm')}.pdf`)
}

// ── 2. Resumen por categoría (sin cambios) ────────────────────
export function exportarResumenCategorias(porCategoria, total, filtros, municipio) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  headerPDF(doc, 'Resumen por Categoría',
    `${filtros.periodo ?? 'Período seleccionado'} · ${total} reportes totales`, municipio)

  autoTable(doc, {
    startY: 36,
    head: [['#','Categoría','Cantidad','% del total','Estatus predominante']],
    body: porCategoria.map((c, i) => [i+1, `${c.emoji} ${c.label}`, c.cantidad, `${c.porcentaje}%`, c.estatusPredominante ?? '—']),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: hexToRgbArr(municipio?.brandColor ?? BRAND), textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248,250,252] },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
  })

  const finalY = doc.lastAutoTable.finalY + 8
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(60,60,60)
  doc.text(`Total de reportes en el período: ${total}`, 14, finalY)
  footerPDF(doc, municipio)
  doc.save(`resumen_categorias_${format(new Date(),'yyyyMMdd_HHmm')}.pdf`)
}

// ── 3. Pendientes — ACTUALIZADO: +Prioridad, +Asignado a ─────
export function exportarPendientes(reportes, municipio) {
  const pendientes = reportes.filter(r => ['Nuevo','En proceso'].includes(r.estatus ?? 'Nuevo'))
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  headerPDF(doc, 'Reportes Pendientes de Atención',
    `${pendientes.length} reportes sin resolver al ${format(new Date(),'dd/MM/yyyy')}`, municipio)

  const cols = ['Folio','Días abierto','Categoría','Prioridad','Estatus','Asignado a','Ubicación','Teléfono']
  const rows = pendientes
    .sort((a, b) => {
      const orden = { alta: 1, media: 2, baja: 3 }
      return (orden[a.prioridad] ?? 4) - (orden[b.prioridad] ?? 4)
    })
    .map(r => {
      const dias = r.fecha ? Math.floor((Date.now() - new Date(r.fecha).getTime()) / 86400000) : '—'
      return [
        r.folio ?? '—',
        typeof dias === 'number' ? `${dias} días` : dias,
        r.categoria ?? '—',
        r.prioridad ? (PRIORIDAD_MAP[r.prioridad]?.label ?? r.prioridad) : '—',
        r.estatus ?? 'Nuevo',
        r.asignado_nombre ?? 'Sin asignar',
        (r.ubicacion ?? '—').slice(0, 45),
        r.telefono ?? '—',
      ]
    })

  autoTable(doc, {
    startY: 36, head: [cols],  body: rows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [239,68,68], textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255,248,248] },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 1) {
        const dias = parseInt(data.cell.text[0])
        if (dias > 7) { data.cell.styles.textColor = [185,28,28]; data.cell.styles.fontStyle = 'bold' }
      }
    },
  })

  footerPDF(doc, municipio)
  doc.save(`pendientes_${format(new Date(),'yyyyMMdd_HHmm')}.pdf`)
}

// ── 4. Mensual — ACTUALIZADO: +Prioridad en detalle ──────────
export function exportarMensual(reportes, anio, mes, municipio) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const nombreMes = format(new Date(anio, mes - 1, 1), 'MMMM yyyy', { locale: es })
  headerPDF(doc,
    `Informe Mensual — ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}`,
    `${reportes.length} reportes · ${municipio?.nombre ?? ''}`, municipio)

  const resueltos = reportes.filter(r => r.estatus === 'Resuelto').length
  const enProceso = reportes.filter(r => r.estatus === 'En proceso').length
  const nuevos    = reportes.filter(r => (r.estatus ?? 'Nuevo') === 'Nuevo').length
  const conFoto   = reportes.filter(r => r.tiene_foto === 'si').length

  autoTable(doc, {
    startY: 36,
    head: [['Métrica','Valor']],
    body: [
      ['Total de reportes recibidos', reportes.length],
      ['Reportes resueltos', `${resueltos} (${total100(resueltos, reportes.length)}%)`],
      ['En proceso', `${enProceso} (${total100(enProceso, reportes.length)}%)`],
      ['Nuevos / Sin atender', `${nuevos} (${total100(nuevos, reportes.length)}%)`],
      ['Con fotografía adjunta', `${conFoto} (${total100(conFoto, reportes.length)}%)`],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: hexToRgbArr(municipio?.brandColor ?? BRAND), textColor: [255,255,255] },
    columnStyles: { 0: { fontStyle: 'bold' } },
    tableWidth: 100,
  })

  const startY2 = doc.lastAutoTable.finalY + 10
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(50,50,50)
  doc.text('Detalle de reportes del mes', 14, startY2)

  autoTable(doc, {
    startY: startY2 + 5,
    head: [['Folio','Categoría','Prioridad','Fecha','Estatus','Asignado a']],
    body: reportes.map(r => [
      r.folio ?? '—', r.categoria ?? '—',
      r.prioridad ? (PRIORIDAD_MAP[r.prioridad]?.label ?? '—') : '—',
      safeDate(r), r.estatus ?? 'Nuevo', r.asignado_nombre ?? '—',
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [100,116,139], textColor: [255,255,255] },
    alternateRowStyles: { fillColor: [248,250,252] },
  })

  footerPDF(doc, municipio)
  doc.save(`informe_mensual_${anio}_${String(mes).padStart(2,'0')}_${format(new Date(),'HHmm')}.pdf`)
}

// ── 5. NUEVA: Órdenes de trabajo activas ─────────────────────
// Pensado para operadores: lista todas las órdenes activas
// ordenadas por prioridad, con conteo de notas y días abierto.
export function exportarOrdenesTrabajo(reportes, municipio) {
  const activos = reportes.filter(r =>
    !['Resuelto','No aplica','Rechazado'].includes(r.estatus ?? 'Nuevo')
  )
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  headerPDF(doc, 'Órdenes de Trabajo Activas',
    `${activos.length} reportes pendientes al ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}`,
    municipio)

  autoTable(doc, {
    startY: 36,
    head: [['Folio','Categoría','Prioridad','Estatus','Asignado a','Días abierto','Notas','Ubicación']],
    body: activos
      .sort((a, b) => {
        const orden = { alta: 1, media: 2, baja: 3 }
        return (orden[a.prioridad] ?? 4) - (orden[b.prioridad] ?? 4)
      })
      .map(r => {
        const dias  = r.fecha ? Math.floor((Date.now() - new Date(r.fecha).getTime()) / 86400000) : '—'
        const notas = (r.actividad ?? []).filter(a => a.tipo === 'nota').length
        return [
          r.folio ?? '—',
          r.categoria ?? '—',
          r.prioridad ? (PRIORIDAD_MAP[r.prioridad]?.label ?? '—') : 'Sin definir',
          r.estatus ?? 'Nuevo',
          r.asignado_nombre ?? 'Sin asignar',
          typeof dias === 'number' ? `${dias}d` : dias,
          notas > 0 ? `${notas}` : '—',
          (r.ubicacion ?? '—').slice(0, 45),
        ]
      }),
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: hexToRgbArr(municipio?.brandColor ?? BRAND), textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248,250,252] },
    columnStyles: {
      0: { cellWidth: 20 }, 1: { cellWidth: 26 }, 2: { cellWidth: 18 },
      3: { cellWidth: 20 }, 4: { cellWidth: 28 },
      5: { cellWidth: 18, halign: 'center' }, 6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 50 },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 2) {
        const prio = PRIORIDAD_MAP[activos[data.row.index]?.prioridad]
        if (prio) data.cell.styles.textColor = hexToRgbArr(prio.color)
      }
      if (data.section === 'body' && data.column.index === 5) {
        const dias = parseInt(data.cell.text[0])
        if (dias > 7) { data.cell.styles.textColor = [185,28,28]; data.cell.styles.fontStyle = 'bold' }
      }
    },
  })

  footerPDF(doc, municipio)
  doc.save(`ordenes_trabajo_${format(new Date(),'yyyyMMdd_HHmm')}.pdf`)
}

// ── 6. NUEVA: Historial de actividad de un reporte ────────────
// Exporta el timeline completo de notas, cambios de estatus
// y asignaciones de un reporte individual.
export function exportarHistorialReporte(reporte, municipio) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' })
  const cat  = CATEGORIA_MAP[reporte.categoria]

  headerPDF(doc,
    `Historial — ${reporte.folio ?? ''}`,
    `${cat ? `${cat.emoji} ${cat.label}` : reporte.categoria ?? '—'} · ${reporte.ubicacion ?? '—'}`,
    municipio
  )

  autoTable(doc, {
    startY: 36,
    head: [['Campo','Valor']],
    body: [
      ['Folio', reporte.folio ?? '—'],
      ['Categoría', reporte.categoria ?? '—'],
      ['Subtipo', reporte.subtipo ?? '—'],
      ['Estatus', reporte.estatus ?? 'Nuevo'],
      ['Prioridad', reporte.prioridad ? (PRIORIDAD_MAP[reporte.prioridad]?.label ?? '—') : '—'],
      ['Asignado a', reporte.asignado_nombre ?? 'Sin asignar'],
      ['Ubicación', reporte.ubicacion ?? '—'],
      ['Teléfono', reporte.telefono ?? '—'],
      ['Fecha reporte', safeDate(reporte)],
      ['Atendido por', reporte.atendido_por ?? '—'],
      ['Fecha resolución', reporte.fecha_resolucion ?? '—'],
    ],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: hexToRgbArr(municipio?.brandColor ?? BRAND), textColor: [255,255,255] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    tableWidth: 140,
  })

  const actividad = [...(reporte.actividad ?? [])].sort((a, b) => {
    const ta = a.fecha?.toDate?.()?.getTime() ?? 0
    const tb = b.fecha?.toDate?.()?.getTime() ?? 0
    return ta - tb
  })

  if (actividad.length > 0) {
    const startY2 = doc.lastAutoTable.finalY + 10
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(50,50,50)
    doc.text(`Historial de actividad (${actividad.length} entradas)`, 14, startY2)

    autoTable(doc, {
      startY: startY2 + 5,
      head: [['Fecha y hora','Tipo','Autor','Descripción']],
      body: actividad.map(a => {
        let fecha = '—'
        try {
          const d = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
          fecha = format(d, "dd/MM/yyyy HH:mm", { locale: es })
        } catch {}
        return [fecha, a.tipo ?? 'nota', a.autorNombre ?? '—', a.texto ?? '—']
      }),
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [100,116,139], textColor: [255,255,255] },
      alternateRowStyles: { fillColor: [248,250,252] },
      columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 22 }, 2: { cellWidth: 38 } },
    })
  }

  footerPDF(doc, municipio)
  doc.save(`historial_${reporte.folio ?? 'reporte'}_${format(new Date(),'yyyyMMdd')}.pdf`)
}
