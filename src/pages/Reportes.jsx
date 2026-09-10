// src/pages/Reportes.jsx
import React, { useState, useMemo, useEffect } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Button, Stack,
  Divider, Chip, FormControl, InputLabel, Select, MenuItem,
  TextField, Alert, CircularProgress, Tooltip, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress
} from '@mui/material'
import PictureAsPdfIcon  from '@mui/icons-material/PictureAsPdf'
import TableChartIcon    from '@mui/icons-material/TableChart'
import DownloadIcon      from '@mui/icons-material/Download'
import AssessmentIcon    from '@mui/icons-material/Assessment'
import PendingIcon       from '@mui/icons-material/HourglassEmpty'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CategoryIcon      from '@mui/icons-material/Category'
import RoomIcon          from '@mui/icons-material/Room' 
import EngineeringIcon   from '@mui/icons-material/Engineering' 
import AssignmentIcon    from '@mui/icons-material/Assignment'

import { useReportes }   from '@/hooks/useReportes'
import { useMunicipio }  from '@/contexts/MunicipioContext'
import { useUsuarios }   from '@/hooks/useUsuarios' 
// IMPORTANTE: Asegúrate de importar AREAS_ADMINISTRACION
import { CATEGORIAS, CATEGORIA_MAP, ESTATUS_MAP, AREAS_ADMINISTRACION } from '@/config/categorias'
import { format } from 'date-fns'

import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

import {
  exportarReporteGeneral, exportarResumenCategorias,
  exportarPendientes, exportarMensual, exportarOrdenesTrabajo
} from '@/utils/exportPDF'

import {
  exportarExcelCompleto, exportarCSV,
  exportarExcelPendientes, exportarExcelMensual, exportarExcelOrdenes
} from '@/utils/exportExcel'

// ── Tipos de reporte disponibles ─────────────────────────────
const TIPOS_REPORTE = [
  {
    id: 'general',
    titulo: 'Reporte general',
    desc: 'Todos los reportes con filtros de período, área, categoría, estatus y sector.',
    icon: <AssessmentIcon />,
    color: '#1565C0',
    soporta: ['pdf','excel','csv'],
  },
  {
    id: 'categorias',
    titulo: 'Resumen por categoría',
    desc: 'Conteos y porcentajes agrupados por cada área y categoría de incidencia.',
    icon: <CategoryIcon />,
    color: '#7C3AED',
    soporta: ['pdf','excel'],
  },
  {
    id: 'sectores',
    titulo: 'Análisis por Zona / Sector',
    desc: 'Distribución de reportes según los sectores geográficos configurados.',
    icon: <RoomIcon />,
    color: '#F59E0B',
    soporta: ['excel', 'csv'],
  },
  {
    id: 'operadores',
    titulo: 'Rendimiento de Operadores',
    desc: 'Carga de trabajo y eficiencia de resolución por cada operador asignado.',
    icon: <EngineeringIcon />,
    color: '#06B6D4',
    soporta: ['excel', 'csv'],
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
    desc: 'Todos los reportes pendientes con prioridad, asignación y conteo de notas.',
    icon: <AssignmentIcon />,
    color: '#475569',
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

// ── Componentes Visuales Auxiliares ──────────────────────────
function MiniEstatusChip({ value }) {
  const e = ESTATUS_MAP[value] ?? ESTATUS_MAP['Nuevo']
  return (
    <Chip label={value ?? 'Nuevo'} size="small" sx={{
      height: 20, fontSize: 10, fontWeight: 600,
      bgcolor: e?.bg, color: e?.color,
    }} />
  )
}

function TipoReporteCard({ tipo, seleccionado, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        flexShrink: 0,
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
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: seleccionado ? tipo.color : 'text.primary', lineHeight: 1.2 }}>
              {tipo.titulo}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block', mt: 0.5 }}>
              {tipo.desc}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
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

// ── Vista previa General ─────────────────────────────────────
function VistaPrevia({ reportes, loading }) {
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
  if (!reportes.length) return <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary" variant="body2">No hay datos para los filtros seleccionados</Typography></Box>

  const muestra = reportes.slice(0, 8)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">Vista previa — primeros {muestra.length} de {reportes.length} registros</Typography>
        <Chip label={`${reportes.length} registros`} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 600 }} />
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 320 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Folio</TableCell>
              <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Área / Categoría</TableCell>
              <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Sector</TableCell>
              <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Fecha</TableCell>
              <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Estatus</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {muestra.map(r => {
              const cat = CATEGORIA_MAP[r.categoria]
              return (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{r.folio ?? '—'}</TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block" color="primary.main" fontWeight={600}>{cat?.area || 'Sin área'}</Typography>
                    <Typography variant="caption" color="text.secondary">{cat ? `${cat.emoji} ${cat.label}` : r.categoria ?? '—'}</Typography>
                  </TableCell>
                  <TableCell><Typography variant="caption" color={r.sector === 'Sin asignar' ? 'text.disabled' : 'text.primary'} fontWeight={500}>{r.sector || 'Sin asignar'}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{r.fecha_legible ?? '—'}</Typography></TableCell>
                  <TableCell><MiniEstatusChip value={r.estatus} /></TableCell>
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
  const { municipio }             = useMunicipio()
  const { usuarios }              = useUsuarios() 
  const [zonas, setZonas]         = useState([])

  const [tipoId,     setTipoId]     = useState('general')
  const [periodo,    setPeriodo]    = useState('mes')
  const [areaFiltro, setAreaFiltro] = useState('') // NUEVO: Estado para Área
  const [catFiltro,  setCatFiltro]  = useState('')
  const [estFiltro,  setEstFiltro]  = useState('')
  const [secFiltro,  setSecFiltro]  = useState('')
  const [mesAnio,    setMesAnio]    = useState(format(new Date(), 'yyyy-MM'))
  
  const [generando, setGenerando] = useState(null)
  const [errorMsg,  setErrorMsg]  = useState('')

  const { reportes, loading } = useReportes(periodo === 'todos' ? 'todos' : periodo)
  const tipo = TIPOS_REPORTE.find(t => t.id === tipoId)

  // Cargar Zonas desde Firebase
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const qs = await getDocs(collection(db, 'zonas'))
        setZonas(qs.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) { console.error("Error cargando zonas", e) }
    }
    fetchZonas()
  }, [])

  // NUEVO: Opciones de categoría dinámicas según el área seleccionada
  const categoriasDropdown = useMemo(() => {
    if (!areaFiltro) return CATEGORIAS
    return CATEGORIAS.filter(c => c.area === areaFiltro)
  }, [areaFiltro])

  // Filtrado General Actualizado
  const reportesFiltrados = useMemo(() => {
    let r = reportes
    // Filtrar por Área usando el mapa de categorías
    if (areaFiltro) r = r.filter(x => CATEGORIA_MAP[x.categoria]?.area === areaFiltro)
    if (catFiltro) r = r.filter(x => x.categoria === catFiltro)
    if (estFiltro) r = r.filter(x => (x.estatus ?? 'Nuevo') === estFiltro)
    if (secFiltro) r = r.filter(x => x.sector === secFiltro)
    if (tipoId === 'pendientes' || tipoId === 'ordenes') r = r.filter(x => ['Nuevo','En proceso'].includes(x.estatus ?? 'Nuevo'))
    if (tipoId === 'mensual') {
      const [y, m] = mesAnio.split('-').map(Number)
      r = r.filter(x => {
        const f = x.fecha ?? (x.fecha_iso?.toDate?.() ?? new Date(x.fecha_iso))
        return f instanceof Date && f.getFullYear() === y && f.getMonth() + 1 === m
      })
    }
    return r
  }, [reportes, areaFiltro, catFiltro, estFiltro, secFiltro, tipoId, mesAnio])

  // Procesamiento para Reporte de Categorías
  const porCategoria = useMemo(() => {
    const total = reportesFiltrados.length
    return CATEGORIAS.map(cat => {
      const lista  = reportesFiltrados.filter(r => r.categoria === cat.firestoreValue)
      return {
        ...cat,
        cantidad: lista.length,
        porcentaje: total > 0 ? ((lista.length / total) * 100).toFixed(1) : '0',
      }
    }).filter(c => c.cantidad > 0).sort((a,b) => b.cantidad - a.cantidad)
  }, [reportesFiltrados])

  // Procesamiento para Reporte de Sectores
  const porSector = useMemo(() => {
    const total = reportesFiltrados.length
    const map = {}
    reportesFiltrados.forEach(r => {
      const s = r.sector && r.sector !== "Sin asignar" ? r.sector : 'No clasificado'
      map[s] = (map[s] || 0) + 1
    })
    return Object.entries(map).map(([nombre, cantidad]) => ({
      nombre, cantidad, porcentaje: total > 0 ? ((cantidad / total) * 100).toFixed(1) : '0'
    })).sort((a,b) => b.cantidad - a.cantidad)
  }, [reportesFiltrados])

  // Procesamiento para Rendimiento de Operadores (Nombres Completos)
  const porOperador = useMemo(() => {
    const map = {}
    reportesFiltrados.forEach(r => {
      let asig = 'Sin asignar'
      
      if (r.asignado_a && usuarios?.length > 0) {
        const user = usuarios.find(u => u.id === r.asignado_a)
        if (user && user.nombre) {
          asig = user.nombre
        } else if (r.asignado_nombre) {
          asig = r.asignado_nombre
        }
      } else if (r.asignado_nombre) {
        asig = r.asignado_nombre
      }

      if (!map[asig]) map[asig] = { nombre: asig, asignados: 0, resueltos: 0, pendientes: 0 }
      
      map[asig].asignados++
      if (r.estatus === 'Resuelto') map[asig].resueltos++
      else if (r.estatus !== 'Rechazado' && r.estatus !== 'No aplica') map[asig].pendientes++
    })
    return Object.values(map).sort((a,b) => b.asignados - a.asignados)
  }, [reportesFiltrados, usuarios])

  const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label ?? periodo

  const handleExportar = async (formato) => {
    if (!reportesFiltrados.length) { setErrorMsg('No hay datos para exportar con los filtros seleccionados.'); return }
    setErrorMsg('')
    setGenerando(formato)
    try {
      const [anioStr, mesStr] = mesAnio.split('-')
      // NUEVO: Agregamos el área a los filtros que se pasan al PDF
      const filtros = { periodo: periodoLabel, area: areaFiltro || null, categoria: catFiltro || null, estatus: estFiltro || null }
      
      if (formato === 'pdf') {
        if (tipoId === 'general')    exportarReporteGeneral(reportesFiltrados, filtros, municipio)
        if (tipoId === 'categorias') exportarResumenCategorias(porCategoria, reportesFiltrados.length, filtros, municipio)
        if (tipoId === 'pendientes') exportarPendientes(reportesFiltrados, municipio)
        if (tipoId === 'mensual')    exportarMensual(reportesFiltrados, Number(anioStr), Number(mesStr), municipio)
        if (tipoId === 'ordenes')    exportarOrdenesTrabajo(reportesFiltrados, municipio)
      }
      
      if (formato === 'excel') {
        if (tipoId === 'pendientes') exportarExcelPendientes(reportesFiltrados, municipio)
        else if (tipoId === 'mensual') exportarExcelMensual(reportesFiltrados, Number(anioStr), Number(mesStr), municipio)
        else if (tipoId === 'ordenes') exportarExcelOrdenes(reportesFiltrados, municipio)
        else exportarExcelCompleto(reportesFiltrados, municipio)
      }
      
      if (formato === 'csv') {
        if (tipoId === 'sectores') exportarCSV(porSector, municipio)
        else if (tipoId === 'operadores') exportarCSV(porOperador, municipio)
        else exportarCSV(reportesFiltrados, municipio)
      }
    } catch (err) {
      console.error('Error al exportar:', err)
      setErrorMsg(`Error al generar el archivo: ${err.message}`)
    } finally {
      setGenerando(null)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Generador de reportes</Typography>
        <Typography variant="body2" color="text.secondary">
          Analítica, exportación y evaluación de métricas de servicio.
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
                <Stack spacing={1.5} sx={{ maxHeight: 480, overflowY: 'auto', pr: 1, pb: 1 }}>
                  {TIPOS_REPORTE.map(t => (
                    <TipoReporteCard key={t.id} tipo={t} seleccionado={tipoId === t.id} onClick={() => setTipoId(t.id)} />
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* 2. Filtros */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                  2. Parámetros y Filtros
                </Typography>
                <Stack spacing={2}>
                  
                  {tipoId !== 'mensual' && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Período de tiempo</InputLabel>
                      <Select value={periodo} onChange={e => setPeriodo(e.target.value)} label="Período de tiempo">
                        {PERIODOS.map(p => (
                          <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {tipoId === 'mensual' && (
                    <TextField label="Mes y año" type="month" value={mesAnio} onChange={e => setMesAnio(e.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} inputProps={{ max: format(new Date(), 'yyyy-MM') }} />
                  )}

                  {['general', 'pendientes', 'ordenes'].includes(tipoId) && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Sector / Zona</InputLabel>
                      <Select value={secFiltro} onChange={e => setSecFiltro(e.target.value)} label="Sector / Zona">
                        <MenuItem value="">Todos los sectores</MenuItem>
                        {zonas.map(z => (
                          <MenuItem key={z.id} value={z.nombre}>{z.nombre}</MenuItem>
                        ))}
                        <MenuItem value="Sin asignar"><em>Sin clasificar</em></MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {/* NUEVO: Filtro en cascada de Área */}
                  {['general', 'categorias'].includes(tipoId) && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Área o Depto</InputLabel>
                      <Select 
                        value={areaFiltro} 
                        onChange={e => {
                          setAreaFiltro(e.target.value)
                          setCatFiltro('') // Limpiamos la categoría al cambiar de área
                        }} 
                        label="Área o Depto"
                      >
                        <MenuItem value="">Todas las áreas</MenuItem>
                        {Object.values(AREAS_ADMINISTRACION).map(area => (
                          <MenuItem key={area} value={area}>{area}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {['general'].includes(tipoId) && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Categoría</InputLabel>
                      <Select 
                        value={catFiltro} 
                        onChange={e => setCatFiltro(e.target.value)} 
                        label="Categoría"
                        disabled={areaFiltro && categoriasDropdown.length === 0}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {categoriasDropdown.map(c => (
                          <MenuItem key={c.id} value={c.firestoreValue}>{c.emoji} {c.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

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

                <Box sx={{
                  mt: 2, p: 1.5, bgcolor: 'action.hover',
                  borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <Typography variant="caption" color="text.secondary">Total registros analizados</Typography>
                  <Chip label={loading ? '...' : reportesFiltrados.length} size="small" sx={{ fontWeight: 700, fontSize: 13, height: 26, bgcolor: `${tipo.color}18`, color: tipo.color }} />
                </Box>
              </CardContent>
            </Card>

            {/* 3. Exportar */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                  3. Ejecutar Exportación
                </Typography>
                {errorMsg && <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 1.5 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}
                <Stack spacing={1.5}>
                  {tipo.soporta.includes('pdf') && (
                    <Button variant="contained" startIcon={generando === 'pdf' ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />} onClick={() => handleExportar('pdf')} disabled={!!generando || loading} fullWidth sx={{ bgcolor: '#DC2626', justifyContent: 'flex-start', borderRadius: 2, '&:hover': { bgcolor: '#B91C1C' } }}>
                      Generar Documento PDF
                    </Button>
                  )}
                  {tipo.soporta.includes('excel') && (
                    <Button variant="contained" startIcon={generando === 'excel' ? <CircularProgress size={16} color="inherit" /> : <TableChartIcon />} onClick={() => handleExportar('excel')} disabled={!!generando || loading} fullWidth sx={{ bgcolor: '#15803D', justifyContent: 'flex-start', borderRadius: 2, '&:hover': { bgcolor: '#166534' } }}>
                      Descargar Base Excel (.xlsx)
                    </Button>
                  )}
                  {tipo.soporta.includes('csv') && (
                    <Button variant="outlined" startIcon={generando === 'csv' ? <CircularProgress size={16} /> : <DownloadIcon />} onClick={() => handleExportar('csv')} disabled={!!generando || loading} fullWidth sx={{ justifyContent: 'flex-start', borderRadius: 2 }}>
                      Extraer Datos Raw (.csv)
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
                <Box sx={{ width: 36, height: 36, borderRadius: 2, flexShrink: 0, bgcolor: `${tipo.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tipo.color, '& svg': { fontSize: 18 } }}>
                  {tipo.icon}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{tipo.titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{tipo.desc}</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* RENDERIZADO DINÁMICO SEGÚN EL TIPO DE REPORTE */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
              ) : tipoId === 'categorias' ? (
                // NUEVO: Agrupación visual por Área en la vista previa
                <Stack spacing={3}>
                  {Object.entries(AREAS_ADMINISTRACION).map(([key, areaNombre]) => {
                    const catsEnArea = porCategoria.filter(c => c.area === areaNombre);
                    if (catsEnArea.length === 0) return null;
                    
                    const totalArea = catsEnArea.reduce((sum, c) => sum + c.cantidad, 0);
                    const pctArea = reportesFiltrados.length > 0 ? ((totalArea / reportesFiltrados.length) * 100).toFixed(1) : '0';

                    return (
                      <Box key={areaNombre}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={700} color="primary.main">{areaNombre}</Typography>
                          <Typography variant="caption" fontWeight={600} color="text.secondary">{totalArea} reportes ({pctArea}%)</Typography>
                        </Box>
                        <Stack spacing={1.5}>
                          {catsEnArea.map(cat => (
                            <Box key={cat.id}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">{cat.emoji} {cat.label}</Typography>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">{cat.porcentaje}%</Typography>
                                  <Typography variant="body2" fontWeight={700}>{cat.cantidad}</Typography>
                                </Box>
                              </Box>
                              <LinearProgress variant="determinate" value={Number(cat.porcentaje)} sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: cat.color } }} />
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )
                  })}
                </Stack>
              ) : tipoId === 'sectores' ? (
                <Stack spacing={1.5}>
                  {porSector.map((sec, i) => (
                    <Box key={i}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600} color={sec.nombre === 'No clasificado' ? 'text.secondary' : 'text.primary'}>
                          <RoomIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom', color: '#F59E0B' }}/>
                          {sec.nombre}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{sec.porcentaje}%</Typography>
                          <Typography variant="body2" fontWeight={700}>{sec.cantidad}</Typography>
                        </Box>
                      </Box>
                      <LinearProgress variant="determinate" value={Number(sec.porcentaje)} sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: '#F59E0B' } }} />
                    </Box>
                  ))}
                </Stack>
              ) : tipoId === 'operadores' ? (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Operador / Responsable</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11 }}>Tickets Asignados</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: 'success.main' }}>Resueltos</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: 'error.main' }}>Pendientes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {porOperador.map((op, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: op.nombre === 'Sin asignar' ? 400 : 600, color: op.nombre === 'Sin asignar' ? 'text.secondary' : 'text.primary' }}>
                            {op.nombre}
                          </TableCell>
                          <TableCell align="center"><Chip size="small" label={op.asignados} sx={{ height: 20, fontSize: 11, fontWeight: 700 }} /></TableCell>
                          <TableCell align="center"><Typography variant="body2" fontWeight={600} color="success.main">{op.resueltos}</Typography></TableCell>
                          <TableCell align="center"><Typography variant="body2" fontWeight={600} color="error.main">{op.pendientes}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <VistaPrevia reportes={reportesFiltrados} loading={loading} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}