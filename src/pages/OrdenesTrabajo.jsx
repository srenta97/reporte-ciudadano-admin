import React, { useState, useMemo } from 'react'
import {
  Box, Card, CardContent, Typography, Stack, Chip,
  Tooltip, ToggleButtonGroup, ToggleButton,
  TextField, InputAdornment, FormControl, InputLabel, Select,
  MenuItem, Divider, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tabs, Tab, useTheme, useMediaQuery, Paper,
  alpha
} from '@mui/material'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import ViewListIcon from '@mui/icons-material/ViewList'
import SearchIcon from '@mui/icons-material/Search'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import RefreshIcon from '@mui/icons-material/Refresh'
import FlagIcon from '@mui/icons-material/Flag'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/HourglassEmpty'
import NewReleasesIcon from '@mui/icons-material/NewReleases'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import TuneIcon from '@mui/icons-material/Tune'
import InboxIcon from '@mui/icons-material/Inbox'
import { useOrdenesTrabajo, COLUMNAS_KANBAN, PRIORIDADES, PRIORIDAD_MAP } from '@/hooks/useOrdenesTrabajo'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { useAuth } from '@/contexts/AuthContext'
import { CATEGORIAS, CATEGORIA_MAP, ESTATUS_MAP } from '@/config/categorias'
import TicketCard from '@/components/tickets/TicketCard'
import TicketDetalle from '@/components/tickets/TicketDetalle'
import FiltroTemporal from '@/components/ui/FiltroTemporal'
import { useCrearNotificacion } from '@/hooks/useCrearNotificacion'
import { useSearchParams } from 'react-router-dom'

function MiniStat({ label, value, color, icon, loading, subtitle }) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: { xs: 'calc(50% - 8px)', sm: 220 },
        borderRadius: 3,
        borderColor: alpha(color, 0.18),
        bgcolor: 'background.paper',
        boxShadow: 'none',
        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 30px ${alpha(color, 0.08)}`,
          borderColor: alpha(color, 0.3),
        },
      }}
    >
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, fontWeight: 700 }}
            >
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1, mt: 0.5 }}>
              {loading ? '—' : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: alpha(color, 0.12),
              color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              '& svg': { fontSize: 22 },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function KanbanColumna({ columna, tickets, onTicketClick, loading }) {
  return (
    <Box
      sx={{
        flex: 1,
        width: '100%',
        minWidth: { xs: '100%', md: 320 },
        bgcolor: alpha(columna.color, 0.04),
        borderRadius: 4,
        border: `1px solid ${alpha(columna.color, 0.16)}`,
        display: 'flex',
        flexDirection: 'column',
        height: { xs: '60vh', md: 'calc(100vh - 360px)' },
        minHeight: 420,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${alpha(columna.color, 0.12)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          bgcolor: alpha(columna.color, 0.05),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: columna.color }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: columna.color, lineHeight: 1.2 }}>
              {columna.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {columna.estatus?.length || 0} estados
            </Typography>
          </Box>
        </Box>

        <Chip
          label={loading ? '…' : tickets.length}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 800,
            bgcolor: alpha(columna.color, 0.12),
            color: columna.color,
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={26} sx={{ color: columna.color }} />
          </Box>
        ) : tickets.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              py: 4,
              color: 'text.secondary',
            }}
          >
            <InboxIcon sx={{ fontSize: 34, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" fontWeight={700}>
              Sin reportes
            </Typography>
            <Typography variant="caption" color="text.secondary">
              No hay tickets en esta columna
            </Typography>
          </Box>
        ) : (
          tickets.map(r => (
            <TicketCard key={r.id} reporte={r} onClick={() => onTicketClick(r)} />
          ))
        )}
      </Box>
    </Box>
  )
}

function VistaLista({ tickets, onTicketClick, loading }) {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Card>
    )
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: 'none',
      }}
    >
      <TableContainer sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Folio</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Prioridad</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Estatus</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Ubicación</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Asignado a</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Días abierto</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Notas</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 7 }}>
                  <InboxIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Sin resultados</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map(r => {
                const cat = CATEGORIA_MAP[r.categoria]
                const prio = PRIORIDAD_MAP[r.prioridad]
                const est = ESTATUS_MAP[r.estatus ?? 'Nuevo']
                const dias = (() => {
                  try {
                    const d = r.fecha instanceof Date ? r.fecha : new Date(r.fecha_iso)
                    return Math.floor((Date.now() - d.getTime()) / 86400000)
                  } catch {
                    return '—'
                  }
                })()
                const notas = (r.actividad ?? []).filter(a => a.tipo === 'nota').length

                return (
                  <TableRow
                    key={r.id}
                    hover
                    onClick={() => onTicketClick(r)}
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
                      {r.folio ?? '—'}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {cat ? `${cat.emoji} ${cat.label}` : r.categoria ?? '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {prio ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <FlagIcon sx={{ fontSize: 14, color: prio.color }} />
                          <Typography variant="body2" sx={{ color: prio.color, fontWeight: 700 }}>
                            {prio.label}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      {est ? (
                        <Chip
                          label={r.estatus ?? 'Nuevo'}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: 10,
                            fontWeight: 800,
                            bgcolor: est.bg,
                            color: est.color,
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography variant="body2" noWrap title={r.ubicacion}>
                        {r.ubicacion ?? '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {r.asignado_nombre || <em>Sin asignar</em>}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: typeof dias === 'number' && dias > 7 ? 'error.main' : 'text.secondary',
                          fontWeight: typeof dias === 'number' && dias > 7 ? 700 : 400,
                        }}
                      >
                        {typeof dias === 'number' ? `${dias}d` : dias}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {notas || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default function OrdenesTrabajo() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { municipio } = useMunicipio()
  const { user, perfil } = useAuth()

  const [filtroTiempo, setFiltroTiempo] = useState('todos')
  const [vista, setVista] = useState('kanban')
  const [soloMios, setSoloMios] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCat, setFiltroCat] = useState('')
  const [filtroPrio, setFiltroPrio] = useState('')
  const [reporteActivo, setReporteActivo] = useState(null)
  const [tabKanban, setTabKanban] = useState(0)

  const [searchParams, setSearchParams] = useSearchParams()
  const ticketIdUrl = searchParams.get('ticketId')

  const {
    reportes,
    loading,
    error,
    agregarNota: originalAgregarNota,
    cambiarEstatus: originalCambiarEstatus,
    cambiarPrioridad: originalCambiarPrioridad,
    asignarReporte: originalAsignarReporte,
  } = useOrdenesTrabajo(filtroTiempo)

  const { crearNotificacion } = useCrearNotificacion()

  React.useEffect(() => {
    if (reportes && reportes.length > 0 && ticketIdUrl) {
      const ticketEncontrado = reportes.find(r => r.id === ticketIdUrl)
      if (ticketEncontrado) {
        setReporteActivo(ticketEncontrado)
        const nuevosParams = new URLSearchParams(searchParams)
        nuevosParams.delete('ticketId')
        setSearchParams(nuevosParams, { replace: true })
      }
    }
  }, [reportes, ticketIdUrl, searchParams, setSearchParams])

  const asignarReporte = async (reporteId, nuevoAsignadoId, nombreAsignado) => {
    await originalAsignarReporte(reporteId, nuevoAsignadoId, nombreAsignado)
    const reporteActual = reportes.find(r => r.id === reporteId)
    const folio = reporteActual?.folio || 'sin folio'
    if (nuevoAsignadoId) {
      await crearNotificacion({
        usuario_destino_id: nuevoAsignadoId,
        titulo: 'Nuevo ticket asignado',
        descripcion: `Se te ha asignado el ticket #${folio}.`,
        tipo: 'info',
        reporte_id: reporteId,
      })
    }
  }

  const cambiarEstatus = async (reporteId, nuevoEstatus) => {
    await originalCambiarEstatus(reporteId, nuevoEstatus)
    const reporteActual = reportes.find(r => r.id === reporteId)
    if (reporteActual?.asignado_a && reporteActual.asignado_a !== user?.uid) {
      await crearNotificacion({
        usuario_destino_id: reporteActual.asignado_a,
        titulo: 'Estatus actualizado',
        descripcion: `El ticket #${reporteActual.folio || ''} ahora está "${nuevoEstatus}".`,
        tipo: nuevoEstatus === 'Resuelto' ? 'success' : 'info',
        reporte_id: reporteId,
      })
    }
  }

  const agregarNota = async (reporteId, notaText) => {
    await originalAgregarNota(reporteId, notaText)
    const reporteActual = reportes.find(r => r.id === reporteId)
    if (reporteActual?.asignado_a && reporteActual.asignado_a !== user?.uid) {
      await crearNotificacion({
        usuario_destino_id: reporteActual.asignado_a,
        titulo: `Nueva nota en ticket #${reporteActual.folio || ''}`,
        descripcion: `${perfil?.nombre || 'Alguien'} ha dejado un comentario.`,
        tipo: 'info',
        reporte_id: reporteId,
      })
    }
  }

  const cambiarPrioridad = async (reporteId, nuevaPrioridad) => {
    await originalCambiarPrioridad(reporteId, nuevaPrioridad)
    const reporteActual = reportes.find(r => r.id === reporteId)
    if (reporteActual?.asignado_a && reporteActual.asignado_a !== user?.uid) {
      await crearNotificacion({
        usuario_destino_id: reporteActual.asignado_a,
        titulo: 'Cambio de prioridad',
        descripcion: `El ticket #${reporteActual.folio || ''} cambió a prioridad ${nuevaPrioridad}.`,
        tipo: 'warning',
        reporte_id: reporteId,
      })
    }
  }

  const reportesFiltrados = useMemo(() => {
    let r = reportes
    if (soloMios) r = r.filter(x => x.asignado_a === user?.uid)
    if (filtroCat) r = r.filter(x => x.categoria === filtroCat)
    if (filtroPrio) r = r.filter(x => x.prioridad === filtroPrio)
    if (busqueda) {
      const q = busqueda.toLowerCase()
      r = r.filter(x =>
        x.folio?.toLowerCase().includes(q) ||
        x.ubicacion?.toLowerCase().includes(q) ||
        x.categoria?.toLowerCase().includes(q) ||
        x.telefono?.includes(q)
      )
    }
    return r
  }, [reportes, soloMios, filtroCat, filtroPrio, busqueda, user])

  const porColumna = useMemo(() => {
    return Object.fromEntries(
      COLUMNAS_KANBAN.map(col => [
        col.id,
        reportesFiltrados.filter(r => col.estatus.includes(r.estatus ?? 'Nuevo')),
      ])
    )
  }, [reportesFiltrados])

  const misAsignados = reportes.filter(r => r.asignado_a === user?.uid && !['Resuelto', 'No aplica', 'Rechazado'].includes(r.estatus ?? 'Nuevo')).length
  const nuevos = reportes.filter(r => (r.estatus ?? 'Nuevo') === 'Nuevo').length
  const enProceso = reportes.filter(r => r.estatus === 'En proceso').length
  const resueltosHoy = reportes.filter(r => {
    if (r.estatus !== 'Resuelto') return false
    try {
      const d = r.fecha_actualizacion?.toDate?.() ?? new Date(r.fecha_actualizacion)
      return Math.floor((Date.now() - d.getTime()) / 86400000) === 0
    } catch {
      return false
    }
  }).length

  React.useEffect(() => {
    if (reporteActivo) {
      const actualizado = reportes.find(r => r.id === reporteActivo.id)
      if (actualizado) setReporteActivo(actualizado)
    }
  }, [reportes])

  const hayFiltros = busqueda || filtroCat || filtroPrio || soloMios

  return (
    <Box
      sx={{
        p: { xs: 1.25, sm: 2, md: 3 },
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        minHeight: '100%',
      }}
    >
      <Box
        sx={{
          mb: 3,
          p: { xs: 2, md: 2.5 },
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -0.5 }}>
              Órdenes de trabajo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Portal de seguimiento · {municipio.nombre}
              {perfil?.nombre && ` · ${perfil.nombre}`}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap' }}>
            <FiltroTemporal value={filtroTiempo} onChange={setFiltroTiempo} />
            <ToggleButtonGroup
              value={vista}
              exclusive
              onChange={(_, v) => v && setVista(v)}
              size="small"
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2.5,
                '& .MuiToggleButton-root': {
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                },
              }}
            >
              <ToggleButton value="kanban">
                <Tooltip title="Vista kanban">
                  <ViewKanbanIcon sx={{ fontSize: 18 }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="lista">
                <Tooltip title="Vista lista">
                  <ViewListIcon sx={{ fontSize: 18 }} />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Divider sx={{ my: 2.25 }} />

        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          <MiniStat label="Mis asignados" value={misAsignados} color={municipio.brandColor} icon={<AssignmentIcon />} loading={loading} />
          <MiniStat label="Nuevos" value={nuevos} color="#3B82F6" icon={<NewReleasesIcon />} loading={loading} />
          <MiniStat label="En proceso" value={enProceso} color="#D97706" icon={<PendingIcon />} loading={loading} />
          <MiniStat label="Resueltos hoy" value={resueltosHoy} color="#059669" icon={<CheckCircleIcon />} loading={loading} />
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
          Error al cargar los reportes.
        </Alert>
      )}

      <Card
        variant="outlined"
        sx={{
          mb: 2.5,
          borderRadius: 3,
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TuneIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight={800}>
              Filtros
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por folio, ubicación o teléfono"
              size="small"
              sx={{ flex: { xs: '1 1 100%', md: 2 }, minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ flex: 1, minWidth: 160 }}>
              <InputLabel>Categoría</InputLabel>
              <Select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} label="Categoría">
                <MenuItem value="">Todas</MenuItem>
                {CATEGORIAS.map(c => (
                  <MenuItem key={c.id} value={c.firestoreValue}>
                    {c.emoji} {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
              <InputLabel>Prioridad</InputLabel>
              <Select value={filtroPrio} onChange={e => setFiltroPrio(e.target.value)} label="Prioridad">
                <MenuItem value="">Todas</MenuItem>
                {PRIORIDADES.map(p => (
                  <MenuItem key={p.value} value={p.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <FlagIcon sx={{ fontSize: 13, color: p.color }} />
                      {p.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              size="small"
              variant={soloMios ? 'contained' : 'outlined'}
              onClick={() => setSoloMios(v => !v)}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                whiteSpace: 'nowrap',
                flex: { xs: '1 1 auto', md: 'initial' },
                minHeight: 40,
                ...(soloMios && {
                  bgcolor: municipio.brandColor,
                  '&:hover': { bgcolor: municipio.brandColor, filter: 'brightness(1.08)' },
                }),
              }}
            >
              Mis asignados
            </Button>

            {hayFiltros && (
              <Button
                size="small"
                onClick={() => {
                  setBusqueda('')
                  setFiltroCat('')
                  setFiltroPrio('')
                  setSoloMios(false)
                }}
                sx={{ textTransform: 'none', color: 'text.secondary', minHeight: 40 }}
              >
                Limpiar
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2, color: 'text.secondary' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Cargando reportes…</Typography>
        </Box>
      )}

      {vista === 'kanban' && (
        <Box>
          {isMobile && (
            <Tabs
              value={tabKanban}
              onChange={(_, v) => setTabKanban(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 2,
                bgcolor: 'background.paper',
                borderRadius: 2.5,
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: 999,
                  bgcolor: COLUMNAS_KANBAN[tabKanban]?.color,
                },
              }}
            >
              {COLUMNAS_KANBAN.map((col, idx) => (
                <Tab
                  key={col.id}
                  label={`${col.label} (${porColumna[col.id]?.length || 0})`}
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'none',
                    color: tabKanban === idx ? col.color : 'text.secondary',
                  }}
                />
              ))}
            </Tabs>
          )}

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              overflowX: isMobile ? 'hidden' : 'auto',
              pb: 2,
            }}
          >
            {COLUMNAS_KANBAN.map((col, idx) => {
              if (isMobile && tabKanban !== idx) return null
              return (
                <KanbanColumna
                  key={col.id}
                  columna={col}
                  tickets={porColumna[col.id] ?? []}
                  onTicketClick={setReporteActivo}
                  loading={loading}
                />
              )
            })}
          </Box>
        </Box>
      )}

      {vista === 'lista' && (
        <VistaLista
          tickets={reportesFiltrados}
          onTicketClick={setReporteActivo}
          loading={loading}
        />
      )}

      <TicketDetalle
        reporte={reporteActivo}
        open={!!reporteActivo}
        onClose={() => setReporteActivo(null)}
        onAgregarNota={agregarNota}
        onCambiarEstatus={cambiarEstatus}
        onCambiarPrioridad={cambiarPrioridad}
        onAsignar={asignarReporte}
      />
    </Box>
  )
}