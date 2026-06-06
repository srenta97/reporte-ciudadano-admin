// src/components/tickets/TicketDetalle.jsx
// ─────────────────────────────────────────────────────────────
// Drawer lateral que muestra el detalle completo de un reporte,
// permite cambiar estatus, prioridad, agregar notas y asignar
// a un operador (solo admin).
// ─────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react'
import {
  Drawer, Box, Typography, Divider, Chip, Stack, IconButton,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Avatar, Tooltip, CircularProgress, Alert,
} from '@mui/material'
import CloseIcon         from '@mui/icons-material/Close'
import SendIcon          from '@mui/icons-material/Send'
import EditNoteIcon      from '@mui/icons-material/EditNote'
import SwapHorizIcon     from '@mui/icons-material/SwapHoriz'
import PersonIcon        from '@mui/icons-material/PersonOutline'
import FlagIcon          from '@mui/icons-material/Flag'
import OpenInNewIcon     from '@mui/icons-material/OpenInNew'
import { format }        from 'date-fns'
import { es }            from 'date-fns/locale'
import { CATEGORIA_MAP, ESTATUS, ESTATUS_MAP } from '@/config/categorias'
import { PRIORIDADES, PRIORIDAD_MAP }          from '@/hooks/useOrdenesTrabajo'
import { useAuth }       from '@/contexts/AuthContext'
import { useMunicipio }  from '@/contexts/MunicipioContext'
import { useUsuarios }   from '@/hooks/useUsuarios'

const DRAWER_WIDTH = 480

// ── Helpers visuales ──────────────────────────────────────────
function EstatusChip({ value }) {
  const e = ESTATUS_MAP[value] ?? ESTATUS_MAP['Nuevo']
  return <Chip label={value ?? 'Nuevo'} size="small"
    sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: e.bg, color: e.color }} />
}

function PrioridadChip({ value }) {
  if (!value) return null
  const p = PRIORIDAD_MAP[value]
  if (!p) return null
  return <Chip icon={<FlagIcon style={{ fontSize: 13, color: p.color }} />}
    label={p.label} size="small"
    sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: p.bg, color: p.color }} />
}

function safeDate(r) {
  try {
    const d = r.fecha instanceof Date ? r.fecha : new Date(r.fecha_iso)
    return format(d, "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })
  } catch { return r.fecha_legible ?? '—' }
}

function safeDateShort(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    return format(d, "d MMM, HH:mm", { locale: es })
  } catch { return '' }
}

// ── Ícono de entrada de actividad ────────────────────────────
function TipoIcon({ tipo }) {
  const props = { style: { fontSize: 13 } }
  if (tipo === 'estatus')    return <SwapHorizIcon {...props} />
  if (tipo === 'asignacion') return <PersonIcon    {...props} />
  if (tipo === 'prioridad')  return <FlagIcon      {...props} />
  return <EditNoteIcon {...props} />
}

function colorTipo(tipo) {
  if (tipo === 'estatus')    return '#3B82F6'
  if (tipo === 'asignacion') return '#7C3AED'
  if (tipo === 'prioridad')  return '#D97706'
  return '#64748B'
}

// ── Componente principal ──────────────────────────────────────
export default function TicketDetalle({
  reporte, open, onClose,
  onCambiarEstatus, onCambiarPrioridad, onAgregarNota, onAsignar,
}) {
  const { esAdmin, perfil }   = useAuth()
  const { municipio }         = useMunicipio()
  const { usuarios }          = useUsuarios()

  const [nota,          setNota]          = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [estatusLocal,  setEstatusLocal]  = useState('')
  const [prioridadLocal,setPrioridadLocal]= useState('')
  const actividadRef = useRef(null)

  useEffect(() => {
    if (reporte) {
      setEstatusLocal( reporte.estatus   ?? 'Nuevo')
      setPrioridadLocal(reporte.prioridad ?? 'media')
      setNota('')
    }
  }, [reporte?.id])

  // Scroll al fondo del historial al abrirse
  useEffect(() => {
    if (open && actividadRef.current) {
      setTimeout(() => {
        actividadRef.current?.scrollTo({ top: actividadRef.current.scrollHeight, behavior: 'smooth' })
      }, 200)
    }
  }, [open, reporte?.actividad?.length])

  if (!reporte) return null

  const cat         = CATEGORIA_MAP[reporte.categoria]
  const actividad   = [...(reporte.actividad ?? [])].sort((a, b) => {
    const ta = a.fecha?.toDate?.()?.getTime() ?? 0
    const tb = b.fecha?.toDate?.()?.getTime() ?? 0
    return ta - tb
  })
  const operadores  = usuarios.filter(u => ['operador','admin'].includes(u.rol) && u.activo !== false)

  const handleGuardarNota = async () => {
    if (!nota.trim()) return
    setGuardandoNota(true)
    try {
      await onAgregarNota(reporte.id, nota)
      setNota('')
    } finally {
      setGuardandoNota(false)
    }
  }

  const handleEstatusChange = async (nuevoEstatus) => {
    setEstatusLocal(nuevoEstatus)
    await onCambiarEstatus(reporte.id, nuevoEstatus, reporte)
  }

  const handlePrioridadChange = async (nuevaPrioridad) => {
    setPrioridadLocal(nuevaPrioridad)
    await onCambiarPrioridad(reporte.id, nuevaPrioridad)
  }

  const handleAsignar = async (e) => {
    const uid = e.target.value
    const op  = operadores.find(u => u.id === uid)
    await onAsignar(reporte.id, uid || '', op?.nombre ?? '')
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', sm: DRAWER_WIDTH }, display: 'flex', flexDirection: 'column' } }}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <Box sx={{
        px: 2.5, py: 2,
        background: `linear-gradient(135deg, ${municipio.brandColor} 0%, ${municipio.brandColor}CC 100%)`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1,
      }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
            {reporte.folio ?? '—'}
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'white', lineHeight: 1.3, mt: 0.25 }}>
            {cat ? `${cat.emoji} ${cat.label}` : reporte.categoria ?? 'Sin categoría'}
          </Typography>
          {reporte.subtipo && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {reporte.subtipo}
            </Typography>
          )}
          <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
            <EstatusChip value={estatusLocal} />
            <PrioridadChip value={prioridadLocal} />
          </Stack>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white', mt: -0.5 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* ── Cuerpo scrolleable ───────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Datos del reporte */}
        <Box sx={{ p: 2.5 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: 10 }}>
            Información del reporte
          </Typography>
          <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[
              { label: 'Fecha reporte', value: safeDate(reporte) },
              { label: 'Teléfono', value: reporte.telefono ?? '—' },
              { label: 'Atendido por', value: reporte.atendido_por || '—' },
              { label: 'Foto adjunta', value: reporte.tiene_foto === 'si' ? '✅ Sí' : '❌ No' },
            ].map(item => (
              <Box key={item.label}>
                <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                <Typography variant="body2" fontWeight={500}>{item.value}</Typography>
              </Box>
            ))}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="caption" color="text.secondary" display="block">Ubicación</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                  {reporte.ubicacion || '—'}
                </Typography>
                {reporte.lat && reporte.lon && (
                  <Tooltip title="Ver en Google Maps">
                    <IconButton size="small"
                      href={`https://maps.google.com/?q=${reporte.lat},${reporte.lon}`}
                      target="_blank" component="a" rel="noopener noreferrer">
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>

          {/* Foto */}
          {reporte.foto_url && (
            <Box
              component="img" src={reporte.foto_url} alt="Evidencia"
              sx={{ width: '100%', borderRadius: 2, mt: 1.5, maxHeight: 180, objectFit: 'cover', cursor: 'pointer' }}
              onClick={() => window.open(reporte.foto_url, '_blank')}
            />
          )}
        </Box>

        <Divider />

        {/* Controles de gestión */}
        <Box sx={{ p: 2.5 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: 10 }}>
            Gestión
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {/* Estatus */}
            <FormControl fullWidth size="small">
              <InputLabel>Estatus</InputLabel>
              <Select value={estatusLocal} onChange={e => handleEstatusChange(e.target.value)} label="Estatus">
                {ESTATUS.map(e => (
                  <MenuItem key={e.value} value={e.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: e.color, flexShrink: 0 }} />
                      {e.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Prioridad */}
            <FormControl fullWidth size="small">
              <InputLabel>Prioridad</InputLabel>
              <Select value={prioridadLocal} onChange={e => handlePrioridadChange(e.target.value)} label="Prioridad">
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

            {/* Asignación — solo admin */}
            {esAdmin && (
              <FormControl fullWidth size="small">
                <InputLabel>Asignado a</InputLabel>
                <Select
                  value={reporte.asignado_a ?? ''}
                  onChange={handleAsignar}
                  label="Asignado a"
                >
                  <MenuItem value=""><em>Sin asignar</em></MenuItem>
                  {operadores.map(op => (
                    <MenuItem key={op.id} value={op.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: municipio.brandColor }}>
                          {(op.nombre || op.email || 'O')[0].toUpperCase()}
                        </Avatar>
                        {op.nombre ?? op.email}
                        <Chip label={op.rol} size="small" sx={{ height: 16, fontSize: 9, ml: 0.5 }} />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Mostrar asignación si no es admin */}
            {!esAdmin && reporte.asignado_nombre && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.25,
                bgcolor: 'action.hover', borderRadius: 2 }}>
                <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: municipio.brandColor }}>
                  {reporte.asignado_nombre[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Asignado a</Typography>
                  <Typography variant="body2" fontWeight={600}>{reporte.asignado_nombre}</Typography>
                </Box>
              </Box>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Historial de actividad */}
        <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: 10 }}>
            Actividad ({actividad.length})
          </Typography>

          <Box
            ref={actividadRef}
            sx={{ flex: 1, overflow: 'auto', mt: 1.5, maxHeight: 320,
              display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            {actividad.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Sin actividad registrada aún
              </Typography>
            )}
            {actividad.map((entrada, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                {/* Ícono del tipo */}
                <Box sx={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, mt: 0.25,
                  bgcolor: `${colorTipo(entrada.tipo)}18`,
                  color: colorTipo(entrada.tipo),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TipoIcon tipo={entrada.tipo} />
                </Box>
                {/* Contenido */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="caption" fontWeight={600} color="text.primary">
                      {entrada.autorNombre ?? 'Sistema'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: 10 }}>
                      {safeDateShort(entrada.fecha)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {entrada.texto}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Footer: agregar nota ─────────────────────────── */}
      <Box sx={{
        p: 2, borderTop: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            value={nota}
            onChange={e => setNota(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGuardarNota() } }}
            placeholder="Escribe una nota o actualización..."
            multiline
            maxRows={3}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Tooltip title="Enviar nota (Enter)">
            <span>
              <IconButton
                onClick={handleGuardarNota}
                disabled={!nota.trim() || guardandoNota}
                sx={{
                  bgcolor: municipio.brandColor, color: 'white', mb: 0.25,
                  '&:hover': { bgcolor: municipio.brandColor, filter: 'brightness(1.1)' },
                  '&:disabled': { bgcolor: 'action.disabled' },
                }}
              >
                {guardandoNota ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Enter para enviar · Shift+Enter para nueva línea
        </Typography>
      </Box>
    </Drawer>
  )
}
