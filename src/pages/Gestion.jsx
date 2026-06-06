// src/pages/Gestion.jsx
import React, { useState, useMemo } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Chip, Stack,
  TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Divider, CircularProgress, Avatar, Tooltip,
  Collapse,
} from '@mui/material'
import SearchIcon      from '@mui/icons-material/Search'
import FilterListIcon  from '@mui/icons-material/FilterList'
import EditIcon        from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon  from '@mui/icons-material/ExpandMore'
import ExpandLessIcon  from '@mui/icons-material/ExpandLess'
import OpenInNewIcon   from '@mui/icons-material/OpenInNew'
import { useReportes } from '@/hooks/useReportes'
import { useMunicipio }from '@/contexts/MunicipioContext'
import { useAuth }     from '@/contexts/AuthContext'
import { CATEGORIAS, CATEGORIA_MAP, ESTATUS, ESTATUS_MAP } from '@/config/categorias'
import FiltroTemporal  from '@/components/ui/FiltroTemporal'
import { format }      from 'date-fns'
import { es }          from 'date-fns/locale'
import FlagIcon       from '@mui/icons-material/Flag'
import { PRIORIDADES, PRIORIDAD_MAP } from '@/hooks/useOrdenesTrabajo'
import { useUsuarios } from '@/hooks/useUsuarios'

// ── Chip de estatus ──────────────────────────────────────────
function EstatusChip({ value }) {
  const e = ESTATUS_MAP[value] ?? ESTATUS_MAP['Nuevo']
  return (
    <Chip label={value ?? 'Nuevo'} size="small" sx={{
      height: 22, fontSize: 11, fontWeight: 600,
      bgcolor: e.bg, color: e.color,
    }} />
  )
}

// ── Chip de categoría ────────────────────────────────────────
function CategoriaChip({ value }) {
  const cat = CATEGORIA_MAP[value] ?? CATEGORIA_MAP['Otro']
  if (!cat) return <Typography variant="caption">{value ?? '—'}</Typography>
  return (
    <Chip
      label={`${cat.emoji} ${cat.label}`}
      size="small"
      sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: cat.chipBg, color: cat.chipTxt }}
    />
  )
}

function PrioridadChip({ value }) {
  if (!value) return <Typography variant="caption" color="text.secondary">—</Typography>
  const p = PRIORIDAD_MAP[value]
  if (!p) return null
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <FlagIcon sx={{ fontSize: 13, color: p.color }} />
      <Typography variant="caption" sx={{ color: p.color, fontWeight: 600 }}>
        {p.label}
      </Typography>
    </Box>
  )
}

// ── Modal de edición del ciclo de vida ───────────────────────
function ModalEditar({ reporte, open, onClose, onSave }) {
  const [estatus,         setEstatus]         = useState(reporte?.estatus         ?? 'Nuevo')
  const [prioridad,       setPrioridad]       = useState(reporte?.prioridad        ?? '')
  const [atendidoPor,     setAtendidoPor]     = useState(reporte?.atendido_por    ?? '')
  const [notas,           setNotas]           = useState(reporte?.notas_internas  ?? '')
  const [fechaResolucion, setFechaResolucion] = useState(reporte?.fecha_resolucion ?? '')
  const [saving, setSaving] = useState(false)
  const { esAdmin } = useAuth()
  const { usuarios } = useUsuarios()
  const operadores = usuarios.filter(u => ['operador','admin'].includes(u.rol) && u.activo !== false)

  React.useEffect(() => {
    if (reporte) {
      setEstatus(reporte.estatus ?? 'Nuevo')
      setPrioridad(reporte.prioridad ?? '')
      setAtendidoPor(reporte.atendido_por ?? '')
      setNotas(reporte.notas_internas ?? '')
      setFechaResolucion(reporte.fecha_resolucion ?? '')
    }
  }, [reporte])

  if (!reporte) return null

  const cat = CATEGORIA_MAP[reporte.categoria] ?? {}

  const handleSave = async () => {
    setSaving(true)
    await onSave(reporte.id, {
      estatus,
      prioridad,                       // ← nuevo
      atendido_por:    atendidoPor,
      notas_internas:  notas,
      fecha_resolucion: fechaResolucion,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          Gestionar reporte
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Folio: {reporte.folio}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        {/* Resumen del reporte */}
        <Box sx={{
          p: 2, borderRadius: 2, bgcolor: 'action.hover', mb: 3,
          display: 'flex', flexDirection: 'column', gap: 1,
        }}>
          <CategoriaChip value={reporte.categoria} />
          {reporte.subtipo && (
            <Typography variant="body2" color="text.secondary">
              Problema: {reporte.subtipo}
            </Typography>
          )}
          <Typography variant="body2">
            📍 {reporte.ubicacion || 'Sin ubicación'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reportado el {reporte.fecha
              ? format(reporte.fecha, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
              : reporte.fecha_legible ?? '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tel: {reporte.telefono ?? '—'}
          </Typography>
          {reporte.foto_url && (
            <Box
              component="img"
              src={reporte.foto_url}
              alt="Evidencia"
              sx={{ borderRadius: 1.5, maxHeight: 160, objectFit: 'cover', mt: 0.5 }}
            />
          )}
        </Box>

        <Stack spacing={2.5}>
          {/* Estatus */}
          <FormControl fullWidth size="small">
            <InputLabel>Estatus del reporte</InputLabel>
            <Select value={estatus} onChange={e => setEstatus(e.target.value)} label="Estatus del reporte">
              {ESTATUS.map(e => (
                <MenuItem key={e.value} value={e.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: e.color }} />
                    {e.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Atendido por */}
          <TextField
            label="Atendido por"
            value={atendidoPor}
            onChange={e => setAtendidoPor(e.target.value)}
            placeholder="Nombre del funcionario o área"
            size="small"
            fullWidth
          />

          {/* Fecha de resolución */}
          <TextField
            label="Fecha de resolución"
            type="date"
            value={fechaResolucion}
            onChange={e => setFechaResolucion(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Notas internas */}
          <TextField
            label="Notas internas"
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Observaciones, detalles de la atención..."
            size="small"
            fullWidth
            multiline
            rows={3}
          />

          {/* Prioridad */}
          <FormControl fullWidth size="small">
            <InputLabel>Prioridad</InputLabel>
            <Select value={prioridad} onChange={e => setPrioridad(e.target.value)} label="Prioridad">
              <MenuItem value=""><em>Sin definir</em></MenuItem>
              {PRIORIDADES.map(p => (
                <MenuItem key={p.value} value={p.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FlagIcon sx={{ fontSize: 14, color: p.color }} />
                    {p.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Asignado a — solo admins */}
          {esAdmin && (
            <FormControl fullWidth size="small">
              <InputLabel>Asignado a</InputLabel>
              <Select
                value={reporte.asignado_a ?? ''}
                onChange={async (e) => {
                  const uid = e.target.value
                  const op  = operadores.find(u => u.id === uid)
                  await onSave(reporte.id, {
                    asignado_a:      uid ?? '',
                    asignado_nombre: op?.nombre ?? '',
                  })
                }}
                label="Asignado a"
              >
                <MenuItem value=""><em>Sin asignar</em></MenuItem>
                {operadores.map(op => (
                  <MenuItem key={op.id} value={op.id}>{op.nombre ?? op.email}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Fila expandible de la tabla ──────────────────────────────
function FilaReporte({ reporte, onEditar }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& td': { borderBottom: expanded ? 'none' : undefined } }}
        onClick={() => setExpanded(v => !v)}
      >
        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {reporte.folio}
        </TableCell>
        <TableCell>
          <CategoriaChip value={reporte.categoria} />
        </TableCell>
        <TableCell sx={{ maxWidth: 180 }}>
          <Typography variant="body2" noWrap title={reporte.ubicacion}>
            {reporte.ubicacion || '—'}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="caption" color="text.secondary">
            {reporte.fecha
              ? format(reporte.fecha, 'd MMM yy', { locale: es })
              : reporte.fecha_legible ?? '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <EstatusChip value={reporte.estatus} />
        </TableCell>
        <TableCell align="right" onClick={e => e.stopPropagation()}>
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="Editar reporte">
              <IconButton size="small" onClick={() => onEditar(reporte)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {reporte.lat && reporte.lon && (
              <Tooltip title="Ver en Google Maps">
                <IconButton
                  size="small"
                  href={`https://maps.google.com/?q=${reporte.lat},${reporte.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  component="a"
                  onClick={e => e.stopPropagation()}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small">
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
        </TableCell>
        <TableCell><PrioridadChip value={reporte.prioridad} /></TableCell>
        <TableCell>
          <Typography variant="caption" color="text.secondary">
            {reporte.asignado_nombre || '—'}
          </Typography>
        </TableCell>
      </TableRow>

      {/* Fila expandida con detalles */}
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, px: 2 }}>
          <Collapse in={expanded} unmountOnExit>
            <Box sx={{ py: 2, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {reporte.subtipo && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Subtipo</Typography>
                  <Typography variant="body2" fontWeight={500}>{reporte.subtipo}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Teléfono</Typography>
                <Typography variant="body2" fontWeight={500}>{reporte.telefono ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Foto</Typography>
                <Typography variant="body2" fontWeight={500}>{reporte.tiene_foto === 'si' ? '✅ Sí' : '❌ No'}</Typography>
              </Box>
              {reporte.atendido_por && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Atendido por</Typography>
                  <Typography variant="body2" fontWeight={500}>{reporte.atendido_por}</Typography>
                </Box>
              )}
              {reporte.notas_internas && (
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Notas internas</Typography>
                  <Typography variant="body2">{reporte.notas_internas}</Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function Gestion() {
  const [filtro,       setFiltro]       = useState('mes')
  const [busqueda,     setBusqueda]     = useState('')
  const [catFiltro,    setCatFiltro]    = useState('')
  const [estatusFiltro,setEstatusFiltro]= useState('')
  const [page,         setPage]         = useState(0)
  const [rowsPerPage,  setRowsPerPage]  = useState(20)
  const [reporteEdit,  setReporteEdit]  = useState(null)

  const { municipio }                         = useMunicipio()
  const { reportes, loading, actualizarReporte } = useReportes(filtro)

  const filtrados = useMemo(() => {
    return reportes.filter(r => {
      const matchBusqueda = !busqueda ||
        r.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.ubicacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.telefono?.includes(busqueda)
      const matchCat     = !catFiltro    || r.categoria === catFiltro
      const matchEstatus = !estatusFiltro || r.estatus  === estatusFiltro
      return matchBusqueda && matchCat && matchEstatus
    })
  }, [reportes, busqueda, catFiltro, estatusFiltro])

  const paginados = filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Gestión de reportes</Typography>
          <Typography variant="body2" color="text.secondary">
            Ciclo de vida · {filtrados.length} reportes {busqueda || catFiltro || estatusFiltro ? 'filtrados' : 'en período'}
          </Typography>
        </Box>
        <FiltroTemporal value={filtro} onChange={setFiltro} />
      </Box>

      {/* Filtros de búsqueda */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setPage(0) }}
                placeholder="Buscar por folio, dirección o teléfono..."
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={catFiltro}
                  onChange={e => { setCatFiltro(e.target.value); setPage(0) }}
                  label="Categoría"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {CATEGORIAS.map(c => (
                    <MenuItem key={c.id} value={c.firestoreValue}>
                      {c.emoji} {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estatus</InputLabel>
                <Select
                  value={estatusFiltro}
                  onChange={e => { setEstatusFiltro(e.target.value); setPage(0) }}
                  label="Estatus"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {ESTATUS.map(e => (
                    <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1} sx={{ display: 'flex', gap: 1 }}>
              {(busqueda || catFiltro || estatusFiltro) && (
                <Button
                  size="small"
                  onClick={() => { setBusqueda(''); setCatFiltro(''); setEstatusFiltro(''); setPage(0) }}
                  sx={{ textTransform: 'none', color: 'text.secondary', fontSize: 12 }}
                >
                  Limpiar
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Folio</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Prioridad</TableCell>       {/* ← nuevo */}
                <TableCell>Ubicación</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Asignado a</TableCell>      {/* ← nuevo */}
                <TableCell>Estatus</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1 }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay reportes que coincidan con los filtros</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginados.map(r => (
                  <FilaReporte key={r.id} reporte={r} onEditar={setReporteEdit} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtrados.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Card>

      {/* Modal de edición */}
      <ModalEditar
        reporte={reporteEdit}
        open={!!reporteEdit}
        onClose={() => setReporteEdit(null)}
        onSave={actualizarReporte}
      />
    </Box>
  )
}
