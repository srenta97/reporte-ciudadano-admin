// src/pages/Gestion.jsx
import React, { useState, useMemo, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Chip, Stack,
  TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Divider, CircularProgress, Tooltip,
  Collapse, Checkbox, Toolbar
} from '@mui/material'
import SearchIcon      from '@mui/icons-material/Search'
import EditIcon        from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon  from '@mui/icons-material/ExpandMore'
import ExpandLessIcon  from '@mui/icons-material/ExpandLess'
import OpenInNewIcon   from '@mui/icons-material/OpenInNew'
import FlagIcon        from '@mui/icons-material/Flag'
import { useReportes } from '@/hooks/useReportes'
import { useMunicipio }from '@/contexts/MunicipioContext'
import { useAuth }     from '@/contexts/AuthContext'
import { CATEGORIAS, CATEGORIA_MAP, ESTATUS, ESTATUS_MAP, SUBTIPOS } from '@/config/categorias'
import FiltroTemporal  from '@/components/ui/FiltroTemporal'
import { format }      from 'date-fns'
import { es }          from 'date-fns/locale'
import { PRIORIDADES, PRIORIDAD_MAP } from '@/hooks/useOrdenesTrabajo'
import { useUsuarios } from '@/hooks/useUsuarios'

// Imports de Firebase para cargar los Sectores disponibles
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

// ── Componentes Pequeños (Chips) ─────────────────────────────
function EstatusChip({ value }) {
  const e = ESTATUS_MAP[value] ?? ESTATUS_MAP['Nuevo']
  return (
    <Chip label={value ?? 'Nuevo'} size="small" sx={{
      height: 22, fontSize: 11, fontWeight: 600,
      bgcolor: e.bg, color: e.color,
    }} />
  )
}

function CategoriaChip({ value }) {
  const cat = CATEGORIA_MAP[value] ?? CATEGORIA_MAP['Otro']
  if (!cat) return <Typography variant="caption">{value ?? '—'}</Typography>
  return (
    <Chip
      label={`${cat?.emoji || ''} ${cat?.label || value}`}
      size="small"
      sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: cat?.chipBg, color: cat?.chipTxt }}
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

// ── Modal de edición individual COMPLETO (Corregido visualmente) ──
function ModalEditar({ reporte, open, onClose, onSave, zonas }) {
  // Estados de Información del Reporte
  const [categoria,       setCategoria]       = useState('')
  const [subtipo,         setSubtipo]         = useState('')
  const [sector,          setSector]          = useState('')
  const [ubicacion,       setUbicacion]       = useState('')
  const [descripcion,     setDescripcion]     = useState('')
  const [telefono,        setTelefono]        = useState('')

  // Estados de Gestión
  const [estatus,         setEstatus]         = useState('')
  const [prioridad,       setPrioridad]       = useState('')
  const [atendidoPor,     setAtendidoPor]     = useState('')
  const [notas,           setNotas]           = useState('')
  const [fechaResolucion, setFechaResolucion] = useState('')
  const [asignadoA,       setAsignadoA]       = useState('')
  const [asignadoNombre,  setAsignadoNombre]  = useState('')

  const [saving, setSaving] = useState(false)
  const { esAdmin } = useAuth()
  const { usuarios } = useUsuarios()
  const operadores = usuarios.filter(u => ['operador','admin'].includes(u.rol) && u.activo !== false)

  React.useEffect(() => {
    if (reporte) {
      setCategoria(reporte.categoria ?? '')
      setSubtipo(reporte.subtipo ?? '')
      setSector(reporte.sector ?? 'Sin asignar')
      setUbicacion(reporte.ubicacion ?? '')
      setDescripcion(reporte.descripcion ?? '')
      setTelefono(reporte.telefono ?? '')

      setEstatus(reporte.estatus ?? 'Nuevo')
      setPrioridad(reporte.prioridad ?? '')
      setAtendidoPor(reporte.atendido_por ?? '')
      setNotas(reporte.notas_internas ?? '')
      setFechaResolucion(reporte.fecha_resolucion ?? '')
      setAsignadoA(reporte.asignado_a ?? '')
      setAsignadoNombre(reporte.asignado_nombre ?? '')
    }
  }, [reporte])

  if (!reporte) return null

  const subtiposDisponibles = SUBTIPOS[categoria] ?? []

  const handleSave = async () => {
    setSaving(true)
    await onSave(reporte.id, {
      categoria,
      subtipo,
      sector,
      ubicacion,
      descripcion,
      telefono,
      estatus,
      prioridad,
      atendido_por: atendidoPor,
      notas_internas: notas,
      fecha_resolucion: fechaResolucion,
      asignado_a: asignadoA,
      asignado_nombre: asignadoNombre
    })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Modificar reporte completo</Typography>
          <Typography variant="caption" color="text.secondary">Folio: {reporte.folio}</Typography>
        </Box>
        <EstatusChip value={estatus} />
      </DialogTitle>
      <Divider />
      
      <DialogContent sx={{ pt: 3, pb: 4 }}>
        <Grid container spacing={4}>
          
          {/* COLUMNA IZQUIERDA: Información del Ciudadano / Reporte */}
          <Grid item xs={12} md={6}>
            <Typography variant="overline" color="primary" fontWeight={700} sx={{ mb: 2, display: 'block', lineHeight: 1 }}>
              Datos del Incidente
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoría</InputLabel>
                  <Select value={categoria} onChange={e => {setCategoria(e.target.value); setSubtipo('');}} label="Categoría">
                    {CATEGORIAS.map(c => (
                      <MenuItem key={c.id} value={c.firestoreValue}>{c.emoji} {c.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Subtipo</InputLabel>
                  <Select value={subtipo} onChange={e => setSubtipo(e.target.value)} label="Subtipo">
                    <MenuItem value=""><em>General / Sin definir</em></MenuItem>
                    {subtiposDisponibles.map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sector / Zona</InputLabel>
                  <Select value={sector} onChange={e => setSector(e.target.value)} label="Sector / Zona">
                    <MenuItem value="Sin asignar"><em>Sin clasificar</em></MenuItem>
                    {zonas.map(z => (
                      <MenuItem key={z.id} value={z.nombre}>{z.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField label="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} size="small" fullWidth />
              </Box>

              <TextField label="Ubicación" value={ubicacion} onChange={e => setUbicacion(e.target.value)} size="small" fullWidth />
              <TextField label="Descripción ciudadana" value={descripcion} onChange={e => setDescripcion(e.target.value)} size="small" fullWidth multiline minRows={4} />
            </Box>
          </Grid>

          {/* COLUMNA DERECHA: Gestión Interna */}
          <Grid item xs={12} md={6}>
            <Typography variant="overline" color="secondary" fontWeight={700} sx={{ mb: 2, display: 'block', lineHeight: 1 }}>
              Gestión Interna
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estatus</InputLabel>
                  <Select value={estatus} onChange={e => setEstatus(e.target.value)} label="Estatus">
                    {ESTATUS.map(e => (
                      <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Prioridad</InputLabel>
                  <Select value={prioridad} onChange={e => setPrioridad(e.target.value)} label="Prioridad">
                    <MenuItem value=""><em>Sin definir</em></MenuItem>
                    {PRIORIDADES.map(p => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {esAdmin && (
                <FormControl fullWidth size="small">
                  <InputLabel>Asignado a (Operador)</InputLabel>
                  <Select
                    value={asignadoA}
                    onChange={(e) => {
                      const uid = e.target.value
                      const op  = operadores.find(u => u.id === uid)
                      setAsignadoA(uid)
                      setAsignadoNombre(op?.nombre ?? '')
                    }}
                    label="Asignado a (Operador)"
                  >
                    <MenuItem value=""><em>Sin asignar</em></MenuItem>
                    {operadores.map(op => (
                      <MenuItem key={op.id} value={op.id}>{op.nombre ?? op.email}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Atendido por" value={atendidoPor} onChange={e => setAtendidoPor(e.target.value)} size="small" fullWidth placeholder="Nombre libre" />
                <TextField label="Fecha de resolución" type="date" value={fechaResolucion} onChange={e => setFechaResolucion(e.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
              </Box>

              <TextField label="Notas operativas (Internas)" value={notas} onChange={e => setNotas(e.target.value)} size="small" fullWidth multiline minRows={esAdmin ? 4 : 5} />
            </Box>
          </Grid>

        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: 2, minWidth: 100 }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Fila expandible de la tabla ───────────────────────────────
function FilaReporte({ reporte, onEditar, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <>
      <TableRow
        hover
        selected={isSelected}
        sx={{ cursor: 'pointer', '& td': { borderBottom: expanded ? 'none' : undefined } }}
        onClick={() => setExpanded(v => !v)}
      >
        <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
          <Checkbox checked={isSelected} onChange={(e) => onSelect(e, reporte.id)} />
        </TableCell>

        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {reporte.folio}
        </TableCell>
        <TableCell><CategoriaChip value={reporte.categoria} /></TableCell>
        <TableCell><PrioridadChip value={reporte.prioridad} /></TableCell>
        <TableCell sx={{ maxWidth: 180 }}>
          <Typography variant="body2" noWrap title={reporte.ubicacion}>{reporte.ubicacion || '—'}</Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="caption" color="text.secondary">
            {reporte.fecha ? format(reporte.fecha, 'd MMM yy', { locale: es }) : reporte.fecha_legible ?? '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption" color="text.secondary">{reporte.asignado_nombre || '—'}</Typography>
        </TableCell>
        <TableCell><EstatusChip value={reporte.estatus} /></TableCell>
        
        <TableCell align="right" onClick={e => e.stopPropagation()}>
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="Editar todos los campos">
              <IconButton size="small" onClick={() => onEditar(reporte)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {reporte.lat && reporte.lon && (
              <Tooltip title="Ver en Google Maps">
                <IconButton size="small" href={`https://maps.google.com/?q=${reporte.lat},${reporte.lon}`} target="_blank" rel="noopener noreferrer" component="a" onClick={e => e.stopPropagation()}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small">
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, px: 2 }}>
          <Collapse in={expanded} unmountOnExit>
            <Box sx={{ py: 2, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {reporte.subtipo && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Subtipo</Typography>
                  <Typography variant="body2" fontWeight={500}>{reporte.subtipo}</Typography>
                </Box>
              )}
              {reporte.sector && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Sector / Zona</Typography>
                  <Typography variant="body2" fontWeight={500}>{reporte.sector}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Teléfono</Typography>
                <Typography variant="body2" fontWeight={500}>{reporte.telefono ?? '—'}</Typography>
              </Box>
              {reporte.atendido_por && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Atendido por</Typography>
                  <Typography variant="body2" fontWeight={500}>{reporte.atendido_por}</Typography>
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
  
  const [zonas,        setZonas]        = useState([])

  // Estados para Acciones Masivas
  const [selected, setSelected] = useState([])
  const [bulkActionType, setBulkActionType] = useState('') 
  const [bulkActionValue, setBulkActionValue] = useState('')
  const [isBulking, setIsBulking] = useState(false)

  const { reportes, loading, actualizarReporte } = useReportes(filtro)
  const { esAdmin } = useAuth()
  const { usuarios } = useUsuarios()
  const operadores = usuarios.filter(u => ['operador','admin'].includes(u.rol) && u.activo !== false)

  // Cargar Zonas desde Firebase (Para el modal de edición)
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const qs = await getDocs(collection(db, 'zonas'))
        setZonas(qs.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) { console.error("Error cargando zonas", e) }
    }
    fetchZonas()
  }, [])

  const filtrados = useMemo(() => {
    return reportes.filter(r => {
      const matchBusqueda = !busqueda || r.folio?.toLowerCase().includes(busqueda.toLowerCase()) || r.ubicacion?.toLowerCase().includes(busqueda.toLowerCase()) || r.telefono?.includes(busqueda)
      const matchCat     = !catFiltro    || r.categoria === catFiltro
      const matchEstatus = !estatusFiltro || r.estatus  === estatusFiltro
      return matchBusqueda && matchCat && matchEstatus
    })
  }, [reportes, busqueda, catFiltro, estatusFiltro])

  const paginados = filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(paginados.map(r => r.id))
      return
    }
    setSelected([])
  }

  const handleSelectClick = (event, id) => {
    event.stopPropagation()
    const selectedIndex = selected.indexOf(id)
    let newSelected = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1))
    }
    setSelected(newSelected)
  }

  const applyBulkAction = async () => {
    if (!bulkActionType || !bulkActionValue || selected.length === 0) return
    setIsBulking(true)

    const updateData = {}
    if (bulkActionType === 'estatus') {
      updateData.estatus = bulkActionValue
    } else if (bulkActionType === 'prioridad') {
      updateData.prioridad = bulkActionValue
    } else if (bulkActionType === 'asignar') {
      const op = operadores.find(o => o.id === bulkActionValue)
      updateData.asignado_a = bulkActionValue
      updateData.asignado_nombre = op ? op.nombre : ''
    }

    await Promise.all(selected.map(id => actualizarReporte(id, updateData)))

    setSelected([])
    setBulkActionType('')
    setBulkActionValue('')
    setIsBulking(false)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Gestión de reportes</Typography>
        </Box>
        <FiltroTemporal value={filtro} onChange={setFiltro} />
      </Box>

      {/* Toolbar Dinámico para Acciones Masivas */}
      {selected.length > 0 && (
        <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'primary.dark' }}>
          <Toolbar sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              {selected.length} reportes seleccionados
            </Typography>

            <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Select
                displayEmpty
                value={bulkActionType}
                onChange={(e) => { setBulkActionType(e.target.value); setBulkActionValue(''); }}
              >
                <MenuItem value="" disabled>Seleccionar acción...</MenuItem>
                <MenuItem value="estatus">Cambiar Estatus</MenuItem>
                <MenuItem value="prioridad">Cambiar Prioridad</MenuItem>
                {esAdmin && <MenuItem value="asignar">Asignar a...</MenuItem>}
              </Select>
            </FormControl>

            {bulkActionType === 'estatus' && (
              <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Select value={bulkActionValue} onChange={(e) => setBulkActionValue(e.target.value)} displayEmpty>
                  <MenuItem value="" disabled>Elegir estatus</MenuItem>
                  {ESTATUS.map(e => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {bulkActionType === 'prioridad' && (
              <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Select value={bulkActionValue} onChange={(e) => setBulkActionValue(e.target.value)} displayEmpty>
                  <MenuItem value="" disabled>Elegir prioridad</MenuItem>
                  {PRIORIDADES.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {bulkActionType === 'asignar' && esAdmin && (
              <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Select value={bulkActionValue} onChange={(e) => setBulkActionValue(e.target.value)} displayEmpty>
                  <MenuItem value="" disabled>Elegir funcionario</MenuItem>
                  {operadores.map(op => <MenuItem key={op.id} value={op.id}>{op.nombre ?? op.email}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            <Button
              variant="contained"
              color="primary"
              disabled={!bulkActionType || !bulkActionValue || isBulking}
              onClick={applyBulkAction}
            >
              {isBulking ? <CircularProgress size={24} color="inherit" /> : 'Aplicar a Todos'}
            </Button>
          </Toolbar>
        </Card>
      )}

      {/* Tabla */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < paginados.length}
                    checked={paginados.length > 0 && selected.length === paginados.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>Folio</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Asignado a</TableCell>
                <TableCell>Estatus</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1 }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay reportes para mostrar</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginados.map(r => (
                  <FilaReporte 
                    key={r.id} 
                    reporte={r} 
                    onEditar={setReporteEdit}
                    isSelected={selected.indexOf(r.id) !== -1}
                    onSelect={handleSelectClick}
                  />
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
        />
      </Card>

      <ModalEditar
        reporte={reporteEdit}
        zonas={zonas}
        open={!!reporteEdit}
        onClose={() => setReporteEdit(null)}
        onSave={actualizarReporte}
      />
    </Box>
  )
}