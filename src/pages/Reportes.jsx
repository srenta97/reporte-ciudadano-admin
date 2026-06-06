// src/pages/Reportes.jsx
import React, { useState, useMemo } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Button, Stack,
  Divider, Chip, FormControl, InputLabel, Select, MenuItem,
  TextField, Alert, CircularProgress, Tooltip, Paper,
  ToggleButtonGroup, ToggleButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import PictureAsPdfIcon  from '@mui/icons-material/PictureAsPdf'
import TableChartIcon    from '@mui/icons-material/TableChart'
import DownloadIcon      from '@mui/icons-material/Download'
import AssessmentIcon    from '@mui/icons-material/Assessment'
import PendingIcon       from '@mui/icons-material/HourglassEmpty'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CategoryIcon      from '@mui/icons-material/Category'
import { useReportes }   from '@/hooks/useReportes'
import { useMunicipio }  from '@/contexts/MunicipioContext'
import { CATEGORIAS, CATEGORIA_MAP, ESTATUS_MAP } from '@/config/categorias'
import { format, subDays, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  exportarReporteGeneral, exportarResumenCategorias,
  exportarPendientes, exportarMensual,
} from '@/utils/exportPDF'
import {
  exportarExcelCompleto, exportarCSV,
  exportarExcelPendientes, exportarExcelMensual,
} from '@/utils/exportExcel'
import { exportarOrdenesTrabajo, exportarHistorialReporte } from '@/utils/exportPDF'
import { exportarExcelOrdenes } from '@/utils/exportExcel'
import AssignmentIcon from '@mui/icons-material/Assignment'

// ── Tipos de reporte disponibles ─────────────────────────────
const TIPOS_REPORTE = [
  {
    id: 'general',
    titulo: 'Reporte general',
    desc: 'Todos los reportes con filtros de período, categoría y estatus.',
    icon: <AssessmentIcon />,
    color: '#1565C0',
    soporta: ['pdf','excel','csv'],
  },
  {
    id: 'categorias',
    titulo: 'Resumen por categoría',
    desc: 'Conteos y porcentajes agrupados por cada categoría de incidencia.',
    icon: <CategoryIcon />,
    color: '#7C3AED',
    soporta: ['pdf','excel'],
  },
  {
    id: 'pendientes',
    titulo: 'Pendientes de atención',
    desc: 'Reportes en estatus Nuevo o En proceso, ordenados por antigüedad.',
    icon: <PendingIcon />,
    color: '#DC2626',
    soporta: ['pdf','excel'],
  },
  {
    id: 'mensual',
    titulo: 'Informe mensual',
    desc: 'Consolidado de un mes específico con resumen estadístico y detalle.',
    icon: <CalendarMonthIcon />,
    color: '#059669',
    soporta: ['pdf','excel'],
  },
  {
  id: 'ordenes',
  titulo: 'Órdenes de trabajo activas',
  desc: 'Todos los reportes pendientes con prioridad, asignación y conteo de notas. Ordenado por prioridad.',
  icon: <AssignmentIcon />,
  color: '#7C3AED',
  soporta: ['pdf', 'excel'],
},
]

const PERIODOS = [
  { value: 'dia',    label: 'Hoy',          dias: 1   },
  { value: 'semana', label: 'Esta semana',  dias: 7   },
  { value: 'mes',    label: 'Este mes',     dias: 30  },
  { value: 'trimestre', label: 'Trimestre', dias: 90  },
  { value: 'anio',   label: 'Este año',     dias: 365 },
  { value: 'todos',  label: 'Todo el historial', dias: null },
]

// ── Chip de estatus pequeño ───────────────────────────────────
function MiniEstatusChip({ value }) {
  const e = ESTATUS_MAP[value] ?? ESTATUS_MAP['Nuevo']
  return (
    <Chip label={value ?? 'Nuevo'} size="small" sx={{
      height: 20, fontSize: 10, fontWeight: 600,
      bgcolor: e?.bg, color: e?.color,
    }} />
  )
}

// ── Tarjeta de tipo de reporte ────────────────────────────────
function TipoReporteCard({ tipo, seleccionado, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        border: '1.5px solid',
        borderColor: seleccionado ? tipo.color : 'divider',
        bgcolor: seleccionado ? `${tipo.color}08` : 'background.paper',
        transition: 'all 0.15s',
        '&:hover': { borderColor: tipo.color, bgcolor: `${tipo.color}06` },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2, flexShrink: 0,
            bgcolor: `${tipo.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tipo.color, '& svg': { fontSize: 20 },
          }}>
            {tipo.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: seleccionado ? tipo.color : 'text.primary' }}>
              {tipo.titulo}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
              {tipo.desc}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
              {tipo.soporta.map(f => (
                <Chip key={f} label={f.toUpperCase()} size="small" sx={{
                  height: 16, fontSize: 9, fontWeight: 700,
                  bgcolor: f === 'pdf' ? '#FEE2E2' : f === 'excel' ? '#DCFCE7' : '#EDE9FE',
                  color:   f === 'pdf' ? '#991B1B' : f === 'excel' ? '#14532D' : '#5B21B6',
                }} />
              ))}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ── Vista previa de datos ─────────────────────────────────────
function VistaPrevia({ reportes, tipo, loading }) {
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={28} />
    </Box>
  )

  if (!reportes.length) return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography color="text.secondary" variant="body2">
        No hay datos para los filtros seleccionados
      </Typography>
    </Box>
  )

  const muestra = reportes.slice(0, 8)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Vista previa — primeros {muestra.length} de {reportes.length} registros
        </Typography>
        <Chip label={`${reportes.length} registros`} size="small"
          sx={{ height: 20, fontSize: 10, fontWeight: 600 }} />
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 320 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Folio</TableCell>
              <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Categoría</TableCell>
              <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Fecha</TableCell>
              <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Estatus</TableCell>
              <TableCell sx={{ fontSize: 11, fontWeight: 700, maxWidth: 140 }}>Ubicación</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {muestra.map(r => {
              const cat = CATEGORIA_MAP[r.categoria]
              return (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
                    {r.folio ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {cat ? `${cat.emoji} ${cat.label}` : r.categoria ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {r.fecha_legible ?? r.fecha ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell><MiniEstatusChip value={r.estatus} /></TableCell>
                  <TableCell sx={{ maxWidth: 140 }}>
                    <Typography variant="caption" noWrap title={r.ubicacion}>
                      {r.ubicacion ?? '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function Reportes() {
  const { municipio }                         = useMunicipio()
  const [tipoId,    setTipoId]    = useState('general')
  const [periodo,   setPeriodo]   = useState('mes')
  const [catFiltro, setCatFiltro] = useState('')
  const [estFiltro, setEstFiltro] = useState('')
  const [mesAnio,   setMesAnio]   = useState(format(new Date(), 'yyyy-MM'))
  const [generando, setGenerando] = useState(null) // 'pdf' | 'excel' | 'csv'
  const [errorMsg,  setErrorMsg]  = useState('')

  const { reportes, loading } = useReportes(periodo === 'todos' ? 'todos' : periodo)

  const tipo = TIPOS_REPORTE.find(t => t.id === tipoId)

  // Aplicar filtros adicionales
  const reportesFiltrados = useMemo(() => {
    let r = reportes
    if (catFiltro) r = r.filter(x => x.categoria === catFiltro)
    if (estFiltro) r = r.filter(x => (x.estatus ?? 'Nuevo') === estFiltro)
    if (tipoId === 'pendientes') r = r.filter(x => ['Nuevo','En proceso'].includes(x.estatus ?? 'Nuevo'))
    if (tipoId === 'mensual') {
      const [y, m] = mesAnio.split('-').map(Number)
      r = r.filter(x => {
        const f = x.fecha ?? (x.fecha_iso?.toDate?.() ?? new Date(x.fecha_iso))
        return f instanceof Date && f.getFullYear() === y && f.getMonth() + 1 === m
      })
    }
    return r
  }, [reportes, catFiltro, estFiltro, tipoId, mesAnio])

  // Resumen por categoría para el tipo 'categorias'
  const porCategoria = useMemo(() => {
    const total = reportesFiltrados.length
    return CATEGORIAS.map(cat => {
      const lista  = reportesFiltrados.filter(r => r.categoria === cat.firestoreValue)
      const est    = {}
      lista.forEach(r => { const e = r.estatus ?? 'Nuevo'; est[e] = (est[e] ?? 0) + 1 })
      const predominante = Object.entries(est).sort((a,b) => b[1]-a[1])[0]?.[0] ?? '—'
      return {
        ...cat,
        cantidad: lista.length,
        porcentaje: total > 0 ? ((lista.length / total) * 100).toFixed(1) : '0',
        estatusPredominante: predominante,
      }
    }).filter(c => c.cantidad > 0)
  }, [reportesFiltrados])

  const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label ?? periodo

  const handleExportar = async (formato) => {
    if (!reportesFiltrados.length) { setErrorMsg('No hay datos para exportar con los filtros seleccionados.'); return }
    setErrorMsg('')
    setGenerando(formato)
    try {
      const [anioStr, mesStr] = mesAnio.split('-')
      const filtros = {
        periodo: periodoLabel,
        categoria: catFiltro || null,
        estatus:   estFiltro || null,
      }
      if (formato === 'pdf') {
        if (tipoId === 'general')    exportarReporteGeneral(reportesFiltrados, filtros, municipio)
        if (tipoId === 'categorias') exportarResumenCategorias(porCategoria, reportesFiltrados.length, filtros, municipio)
        if (tipoId === 'pendientes') exportarPendientes(reportesFiltrados, municipio)
        if (tipoId === 'mensual')    exportarMensual(reportesFiltrados, Number(anioStr), Number(mesStr), municipio)
        if (tipoId === 'ordenes') exportarOrdenesTrabajo(reportesFiltrados, municipio)
      }
      if (formato === 'excel') {
        if (tipoId === 'general')    exportarExcelCompleto(reportesFiltrados, municipio)
        if (tipoId === 'categorias') exportarExcelCompleto(reportesFiltrados, municipio)
        if (tipoId === 'pendientes') exportarExcelPendientes(reportesFiltrados, municipio)
        if (tipoId === 'mensual')    exportarExcelMensual(reportesFiltrados, Number(anioStr), Number(mesStr), municipio)
        if (tipoId === 'ordenes') exportarExcelOrdenes(reportesFiltrados, municipio)
      }
      if (formato === 'csv') exportarCSV(reportesFiltrados, municipio)
    } catch (err) {
      console.error('Error al exportar:', err)
      setErrorMsg(`Error al generar el archivo: ${err.message}`)
    } finally {
      setGenerando(null)
    }
  }

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Generador de reportes</Typography>
        <Typography variant="body2" color="text.secondary">
          Exporta la información en PDF, Excel o CSV con los filtros que necesites
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* ── Columna izquierda: configuración ──────────────── */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>

            {/* 1. Tipo de reporte */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                  1. Tipo de reporte
                </Typography>
                <Stack spacing={1}>
                  {TIPOS_REPORTE.map(t => (
                    <TipoReporteCard
                      key={t.id}
                      tipo={t}
                      seleccionado={tipoId === t.id}
                      onClick={() => setTipoId(t.id)}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* 2. Filtros */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                  2. Filtros
                </Typography>
                <Stack spacing={2}>
                  {/* Período — oculto en mensual */}
                  {tipoId !== 'mensual' && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Período</InputLabel>
                      <Select value={periodo} onChange={e => setPeriodo(e.target.value)} label="Período">
                        {PERIODOS.map(p => (
                          <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Selector mes/año — solo para mensual */}
                  {tipoId === 'mensual' && (
                    <TextField
                      label="Mes y año"
                      type="month"
                      value={mesAnio}
                      onChange={e => setMesAnio(e.target.value)}
                      size="small" fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: format(new Date(), 'yyyy-MM') }}
                    />
                  )}

                  {/* Categoría — solo en general */}
                  {tipoId === 'general' && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Categoría</InputLabel>
                      <Select value={catFiltro} onChange={e => setCatFiltro(e.target.value)} label="Categoría">
                        <MenuItem value="">Todas</MenuItem>
                        {CATEGORIAS.map(c => (
                          <MenuItem key={c.id} value={c.firestoreValue}>
                            {c.emoji} {c.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Estatus — en general y categorias */}
                  {['general','categorias'].includes(tipoId) && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Estatus</InputLabel>
                      <Select value={estFiltro} onChange={e => setEstFiltro(e.target.value)} label="Estatus">
                        <MenuItem value="">Todos</MenuItem>
                        {['Nuevo','En proceso','Resuelto','No aplica','Rechazado'].map(e => (
                          <MenuItem key={e} value={e}>{e}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Stack>

                {/* Resumen del filtro aplicado */}
                <Box sx={{
                  mt: 2, p: 1.5, bgcolor: 'action.hover',
                  borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <Typography variant="caption" color="text.secondary">Registros seleccionados</Typography>
                  <Chip
                    label={loading ? '...' : reportesFiltrados.length}
                    size="small"
                    sx={{
                      fontWeight: 700, fontSize: 13, height: 26,
                      bgcolor: `${tipo.color}18`, color: tipo.color,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* 3. Exportar */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                  3. Exportar
                </Typography>

                {errorMsg && (
                  <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 1.5 }} onClose={() => setErrorMsg('')}>
                    {errorMsg}
                  </Alert>
                )}

                <Stack spacing={1.5}>
                  {/* PDF */}
                  {tipo.soporta.includes('pdf') && (
                    <Button
                      variant="contained"
                      startIcon={generando === 'pdf' ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
                      onClick={() => handleExportar('pdf')}
                      disabled={!!generando || loading}
                      fullWidth
                      sx={{
                        bgcolor: '#DC2626', justifyContent: 'flex-start', borderRadius: 2,
                        '&:hover': { bgcolor: '#B91C1C' },
                      }}
                    >
                      Descargar PDF
                    </Button>
                  )}

                  {/* Excel */}
                  {tipo.soporta.includes('excel') && (
                    <Button
                      variant="contained"
                      startIcon={generando === 'excel' ? <CircularProgress size={16} color="inherit" /> : <TableChartIcon />}
                      onClick={() => handleExportar('excel')}
                      disabled={!!generando || loading}
                      fullWidth
                      sx={{
                        bgcolor: '#15803D', justifyContent: 'flex-start', borderRadius: 2,
                        '&:hover': { bgcolor: '#166534' },
                      }}
                    >
                      Descargar Excel (.xlsx)
                    </Button>
                  )}

                  {/* CSV */}
                  {tipo.soporta.includes('csv') && (
                    <Button
                      variant="outlined"
                      startIcon={generando === 'csv' ? <CircularProgress size={16} /> : <DownloadIcon />}
                      onClick={() => handleExportar('csv')}
                      disabled={!!generando || loading}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', borderRadius: 2 }}
                    >
                      Descargar CSV
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* ── Columna derecha: vista previa ─────────────────── */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                  bgcolor: `${tipo.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: tipo.color, '& svg': { fontSize: 18 },
                }}>
                  {tipo.icon}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{tipo.titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{tipo.desc}</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Vista previa o resumen según el tipo */}
              {tipoId === 'categorias' ? (
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={1.5} display="block">
                    Resumen — {reportesFiltrados.length} reportes totales
                  </Typography>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {porCategoria.map(cat => (
                        <Box key={cat.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {cat.emoji} {cat.label}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">{cat.porcentaje}%</Typography>
                              <Typography variant="body2" fontWeight={700}>{cat.cantidad}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ height: 5, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                            <Box sx={{
                              height: '100%', borderRadius: 3,
                              bgcolor: cat.color, width: `${cat.porcentaje}%`,
                              transition: 'width 0.5s ease',
                            }} />
                          </Box>
                        </Box>
                      ))}
                      {!porCategoria.length && (
                        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                          Sin datos para el período seleccionado
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Box>
              ) : (
                <VistaPrevia
                  reportes={reportesFiltrados}
                  tipo={tipoId}
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}