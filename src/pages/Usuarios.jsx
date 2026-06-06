// src/pages/Usuarios.jsx
import React, { useState, useMemo } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Chip, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Tooltip, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, FormControl, InputLabel, Select, MenuItem,
  InputAdornment, Alert, CircularProgress, Avatar,
  ToggleButtonGroup, ToggleButton, Collapse,
} from '@mui/material'
import AddIcon         from '@mui/icons-material/PersonAddAlt1'
import EditIcon        from '@mui/icons-material/EditOutlined'
import BlockIcon       from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon      from '@mui/icons-material/DeleteForever'
import SearchIcon      from '@mui/icons-material/Search'
import PeopleIcon      from '@mui/icons-material/PeopleAlt'
import AdminIcon       from '@mui/icons-material/ManageAccounts'
import OperadorIcon    from '@mui/icons-material/Engineering'
import VisorIcon       from '@mui/icons-material/Visibility'
import { useSnackbar } from 'notistack'
import { useUsuarios } from '@/hooks/useUsuarios'
import { useMunicipio }from '@/contexts/MunicipioContext'
import { useAuth }     from '@/contexts/AuthContext'
import { MUNICIPIOS }  from '@/config/municipios'
import { format }      from 'date-fns'
import { es }          from 'date-fns/locale'

// ── Config de roles ───────────────────────────────────────────
const ROLES = [
  {
    value: 'admin',
    label: 'Administrador',
    desc:  'Acceso completo. Gestiona usuarios, reportes y configuración.',
    icon:  <AdminIcon />,
    color: '#7C3AED',
    bg:    '#EDE9FE',
  },
  {
    value: 'operador',
    label: 'Operador',
    desc:  'Gestiona el ciclo de vida de reportes. Sin acceso a usuarios.',
    icon:  <OperadorIcon />,
    color: '#0284C7',
    bg:    '#E0F2FE',
  },
  {
    value: 'visor',
    label: 'Visor',
    desc:  'Solo lectura. Puede ver dashboard y mapa.',
    icon:  <VisorIcon />,
    color: '#059669',
    bg:    '#D1FAE5',
  },
]
const ROL_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]))

// ── Chips de rol y estatus ────────────────────────────────────
function RolChip({ value }) {
  const r = ROL_MAP[value]
  if (!r) return <Chip label={value} size="small" />
  return (
    <Chip
      icon={<Box sx={{ '& svg': { fontSize: 14, ml: 0.5 }, color: r.color }}>{r.icon}</Box>}
      label={r.label}
      size="small"
      sx={{ bgcolor: r.bg, color: r.color, fontWeight: 600, fontSize: 11, height: 24 }}
    />
  )
}

function EstadoChip({ activo }) {
  return (
    <Chip
      label={activo !== false ? 'Activo' : 'Inactivo'}
      size="small"
      sx={{
        height: 22, fontSize: 11, fontWeight: 600,
        bgcolor: activo !== false ? '#D1FAE5' : '#FEE2E2',
        color:   activo !== false ? '#065F46' : '#991B1B',
      }}
    />
  )
}

// ── Avatar con iniciales ──────────────────────────────────────
function UserAvatar({ nombre, email, color }) {
  const letra = (nombre || email || 'U')[0].toUpperCase()
  return (
    <Avatar sx={{ width: 34, height: 34, bgcolor: color, fontSize: 13, fontWeight: 700 }}>
      {letra}
    </Avatar>
  )
}

// ── Modal crear / editar usuario ──────────────────────────────
function ModalUsuario({ open, onClose, onSave, usuarioEditar, municipioActivo }) {
  const esEdicion = !!usuarioEditar
  const { municipio } = useMunicipio()

  const [nombre,    setNombre]    = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [rol,       setRol]       = useState('visor')
  const [muni,      setMuni]      = useState(municipioActivo)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  React.useEffect(() => {
    if (open) {
      setNombre(  usuarioEditar?.nombre    ?? '')
      setEmail(   usuarioEditar?.email     ?? '')
      setPassword('')
      setRol(     usuarioEditar?.rol       ?? 'visor')
      setMuni(    usuarioEditar?.municipio ?? municipioActivo)
      setError('')
    }
  }, [open, usuarioEditar, municipioActivo])

  const handleSave = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!esEdicion && !email.trim()) { setError('El correo es obligatorio.'); return }
    if (!esEdicion && password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setError('')
    setLoading(true)
    try {
      if (esEdicion) {
        await onSave(usuarioEditar.id, { nombre, rol, municipio: muni })
      } else {
        await onSave({ email, password, nombre, rol, municipio: muni })
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          {esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {esEdicion
            ? `Modificando perfil de ${usuarioEditar.email}`
            : 'Se creará una cuenta en Firebase Authentication'}
        </Typography>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          {/* Nombre */}
          <TextField
            label="Nombre completo"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            fullWidth size="small"
            placeholder="Ej. Juan Pérez García"
          />

          {/* Email — solo en creación */}
          {!esEdicion && (
            <TextField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth size="small"
              placeholder="correo@municipio.gob.mx"
            />
          )}

          {/* Contraseña — solo en creación */}
          {!esEdicion && (
            <TextField
              label="Contraseña inicial"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth size="small"
              helperText="Mínimo 6 caracteres. El usuario podrá cambiarla."
            />
          )}

          {/* Rol */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Rol del usuario
            </Typography>
            <Grid container spacing={1}>
              {ROLES.map(r => (
                <Grid item xs={12} key={r.value}>
                  <Box
                    onClick={() => setRol(r.value)}
                    sx={{
                      p: 1.5, borderRadius: 2, cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: rol === r.value ? r.color : 'divider',
                      bgcolor: rol === r.value ? r.bg : 'transparent',
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: r.color, bgcolor: r.bg },
                    }}
                  >
                    <Box sx={{ color: r.color, '& svg': { fontSize: 20 } }}>{r.icon}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: r.color }}>
                        {r.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.desc}
                      </Typography>
                    </Box>
                    {rol === r.value && (
                      <CheckCircleIcon sx={{ color: r.color, fontSize: 18 }} />
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Municipio */}
          <FormControl fullWidth size="small">
            <InputLabel>Municipio asignado</InputLabel>
            <Select value={muni} onChange={e => setMuni(e.target.value)} label="Municipio asignado">
              {Object.values(MUNICIPIOS).map(m => (
                <MenuItem key={m.slug} value={m.slug}>
                  {m.nombre}, {m.estado}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          disabled={loading}
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          {loading
            ? <CircularProgress size={18} color="inherit" />
            : esEdicion ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Modal de confirmación destructiva ─────────────────────────
function ModalConfirmar({ open, onClose, onConfirm, titulo, mensaje, colorBtn = 'error', labelBtn = 'Confirmar' }) {
  const [loading, setLoading] = useState(false)
  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    onClose()
  }
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>{titulo}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{mensaje}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancelar</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={colorBtn}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          {loading ? <CircularProgress size={16} color="inherit" /> : labelBtn}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function Usuarios() {
  const { municipio }                                 = useMunicipio()
  const { user: authUser }                            = useAuth()
  const { usuarios, loading, error, crear, actualizar,
          desactivar, reactivar, eliminar }           = useUsuarios()

  const [busqueda,      setBusqueda]      = useState('')
  const [filtroRol,     setFiltroRol]     = useState('todos')
  const [filtroEstado,  setFiltroEstado]  = useState('activos')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [usuarioEditar, setUsuarioEditar] = useState(null)
  const [confirmar,     setConfirmar]     = useState(null) // { tipo, usuario }

  // Snackbar (notistack) — fallback simple si no está instalado
  let enqueueSnackbar
  try {
    ;({ enqueueSnackbar } = useSnackbar())
  } catch {
    enqueueSnackbar = (msg, opts) => console.log(msg, opts)
  }

  const notify = (msg, variant = 'success') => {
    enqueueSnackbar(msg, { variant, autoHideDuration: 3000 })
  }

  // ── Filtrado ─────────────────────────────────────────────
  const filtrados = useMemo(() => {
    return usuarios.filter(u => {
      const matchBusqueda = !busqueda ||
        u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email?.toLowerCase().includes(busqueda.toLowerCase())
      const matchRol    = filtroRol    === 'todos' || u.rol === filtroRol
      const matchEstado =
        filtroEstado === 'todos'   ? true :
        filtroEstado === 'activos' ? u.activo !== false :
                                     u.activo === false
      return matchBusqueda && matchRol && matchEstado
    })
  }, [usuarios, busqueda, filtroRol, filtroEstado])

  // ── Totales por rol ───────────────────────────────────────
  const totales = useMemo(() => {
    const activos = usuarios.filter(u => u.activo !== false)
    return {
      total:    usuarios.length,
      activos:  activos.length,
      admins:   activos.filter(u => u.rol === 'admin').length,
      operadores: activos.filter(u => u.rol === 'operador').length,
      visores:  activos.filter(u => u.rol === 'visor').length,
    }
  }, [usuarios])

  // ── Handlers ──────────────────────────────────────────────
  const handleCrear = async (datos) => {
    await crear(datos)
    notify(`Usuario ${datos.nombre} creado correctamente.`)
  }

  const handleEditar = async (uid, cambios) => {
    await actualizar(uid, cambios)
    notify('Usuario actualizado.')
  }

  const handleDesactivar = async (u) => {
    await desactivar(u.id)
    notify(`${u.nombre} desactivado.`, 'warning')
    setConfirmar(null)
  }

  const handleReactivar = async (u) => {
    await reactivar(u.id)
    notify(`${u.nombre} reactivado.`, 'success')
    setConfirmar(null)
  }

  const handleEliminar = async (u) => {
    await eliminar(u.id)
    notify(`${u.nombre} eliminado del sistema.`, 'error')
    setConfirmar(null)
  }

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Gestión de usuarios</Typography>
          <Typography variant="body2" color="text.secondary">
            Alta, baja y modificación de cuentas · {municipio.nombre}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setUsuarioEditar(null); setModalOpen(true) }}
          sx={{ borderRadius: 2, bgcolor: municipio.brandColor,
                '&:hover': { bgcolor: municipio.brandColor, filter: 'brightness(1.1)' } }}
        >
          Nuevo usuario
        </Button>
      </Box>

      {/* Tarjetas de resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total usuarios', value: totales.total,      icon: <PeopleIcon />,    color: municipio.brandColor },
          { label: 'Administradores', value: totales.admins,    icon: <AdminIcon />,     color: '#7C3AED' },
          { label: 'Operadores',     value: totales.operadores,  icon: <OperadorIcon />, color: '#0284C7' },
          { label: 'Visores',        value: totales.visores,     icon: <VisorIcon />,    color: '#059669' },
        ].map(card => (
          <Grid item xs={6} sm={3} key={card.label}>
            <Card>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h3" fontWeight={700} sx={{ lineHeight: 1, mt: 0.5 }}>
                      {loading ? '—' : card.value}
                    </Typography>
                  </Box>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2.5,
                    bgcolor: `${card.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Box sx={{ color: card.color, '& svg': { fontSize: 22 } }}>{card.icon}</Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                size="small" fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                {/* Filtro por rol */}
                <ToggleButtonGroup
                  value={filtroRol} exclusive
                  onChange={(_, v) => v && setFiltroRol(v)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      textTransform: 'none', fontSize: '0.78rem',
                      px: 1.5, py: 0.5, fontWeight: 500,
                      '&.Mui-selected': {
                        bgcolor: municipio.brandColor,
                        color: 'white',
                        '&:hover': { bgcolor: municipio.brandColor },
                      },
                    },
                  }}
                >
                  <ToggleButton value="todos">Todos</ToggleButton>
                  {ROLES.map(r => (
                    <ToggleButton key={r.value} value={r.value}>{r.label}</ToggleButton>
                  ))}
                </ToggleButtonGroup>

                {/* Filtro por estado */}
                <ToggleButtonGroup
                  value={filtroEstado} exclusive
                  onChange={(_, v) => v && setFiltroEstado(v)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      textTransform: 'none', fontSize: '0.78rem',
                      px: 1.5, py: 0.5, fontWeight: 500,
                      '&.Mui-selected': { bgcolor: 'action.selected' },
                    },
                  }}
                >
                  <ToggleButton value="activos">Activos</ToggleButton>
                  <ToggleButton value="inactivos">Inactivos</ToggleButton>
                  <ToggleButton value="todos">Todos</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Error cargando usuarios: {error}
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Municipio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1 }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ fontSize: 40, color: 'action.disabled' }} />
                      <Typography color="text.secondary">
                        {busqueda ? 'No hay usuarios que coincidan con la búsqueda' : 'No hay usuarios en esta categoría'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map(u => {
                  const rolInfo  = ROL_MAP[u.rol]
                  const esMismoUser = u.email === authUser?.email
                  const creado  = u.creado?.toDate?.() ?? null

                  return (
                    <TableRow
                      key={u.id}
                      hover
                      sx={{ opacity: u.activo === false ? 0.55 : 1 }}
                    >
                      {/* Avatar + nombre + email */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <UserAvatar
                            nombre={u.nombre}
                            email={u.email}
                            color={rolInfo?.color ?? municipio.brandColor}
                          />
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {u.nombre || '—'}
                              </Typography>
                              {esMismoUser && (
                                <Chip label="Tú" size="small" sx={{
                                  height: 16, fontSize: 10, fontWeight: 700,
                                  bgcolor: `${municipio.brandColor}18`,
                                  color: municipio.brandColor,
                                }} />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {u.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell><RolChip value={u.rol} /></TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {MUNICIPIOS[u.municipio]?.nombre ?? u.municipio ?? '—'}
                        </Typography>
                      </TableCell>

                      <TableCell><EstadoChip activo={u.activo} /></TableCell>

                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {creado ? format(creado, "d MMM yyyy", { locale: es }) : '—'}
                        </Typography>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {/* Editar */}
                          <Tooltip title="Editar usuario">
                            <IconButton
                              size="small"
                              onClick={() => { setUsuarioEditar(u); setModalOpen(true) }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Desactivar / Reactivar — no aplica para sí mismo */}
                          {!esMismoUser && (
                            u.activo !== false ? (
                              <Tooltip title="Desactivar usuario">
                                <IconButton
                                  size="small"
                                  onClick={() => setConfirmar({ tipo: 'desactivar', usuario: u })}
                                  sx={{ color: 'warning.main' }}
                                >
                                  <BlockIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Reactivar usuario">
                                <IconButton
                                  size="small"
                                  onClick={() => setConfirmar({ tipo: 'reactivar', usuario: u })}
                                  sx={{ color: 'success.main' }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          )}

                          {/* Eliminar — no aplica para sí mismo */}
                          {!esMismoUser && (
                            <Tooltip title="Eliminar permanentemente">
                              <IconButton
                                size="small"
                                onClick={() => setConfirmar({ tipo: 'eliminar', usuario: u })}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer con total */}
        {!loading && filtrados.length > 0 && (
          <Box sx={{
            px: 2, py: 1.5, borderTop: '1px solid',
            borderColor: 'divider', display: 'flex', justifyContent: 'flex-end',
          }}>
            <Typography variant="caption" color="text.secondary">
              {filtrados.length} {filtrados.length === 1 ? 'usuario' : 'usuarios'} mostrados
            </Typography>
          </Box>
        )}
      </Card>

      {/* Modal crear / editar */}
      <ModalUsuario
        open={modalOpen}
        onClose={() => { setModalOpen(false); setUsuarioEditar(null) }}
        onSave={usuarioEditar ? handleEditar : handleCrear}
        usuarioEditar={usuarioEditar}
        municipioActivo={municipio.slug}
      />

      {/* Modales de confirmación */}
      {confirmar?.tipo === 'desactivar' && (
        <ModalConfirmar
          open
          onClose={() => setConfirmar(null)}
          onConfirm={() => handleDesactivar(confirmar.usuario)}
          titulo="Desactivar usuario"
          mensaje={`¿Desactivar a ${confirmar.usuario.nombre}? No podrá iniciar sesión, pero su historial se conserva. Puedes reactivarlo en cualquier momento.`}
          colorBtn="warning"
          labelBtn="Desactivar"
        />
      )}

      {confirmar?.tipo === 'reactivar' && (
        <ModalConfirmar
          open
          onClose={() => setConfirmar(null)}
          onConfirm={() => handleReactivar(confirmar.usuario)}
          titulo="Reactivar usuario"
          mensaje={`¿Reactivar la cuenta de ${confirmar.usuario.nombre}? Podrá iniciar sesión nuevamente.`}
          colorBtn="success"
          labelBtn="Reactivar"
        />
      )}

      {confirmar?.tipo === 'eliminar' && (
        <ModalConfirmar
          open
          onClose={() => setConfirmar(null)}
          onConfirm={() => handleEliminar(confirmar.usuario)}
          titulo="Eliminar usuario permanentemente"
          mensaje={`¿Eliminar a ${confirmar.usuario.nombre} (${confirmar.usuario.email})? Esta acción borra el perfil del sistema. La cuenta de Firebase Authentication permanece inactiva pero puede ser eliminada desde la consola de Firebase.`}
          colorBtn="error"
          labelBtn="Eliminar definitivamente"
        />
      )}
    </Box>
  )
}
