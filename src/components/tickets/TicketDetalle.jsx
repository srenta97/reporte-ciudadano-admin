// src/components/tickets/TicketDetalle.jsx
import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle, IconButton, Typography,
  Box, Chip, Stack, TextField, Button, Avatar, Divider,
  Tooltip, CircularProgress, MenuItem, Select, FormControl, InputLabel,
  alpha, Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/AssignmentInd';
import HistoryIcon from '@mui/icons-material/History';
import MapIcon from '@mui/icons-material/Map';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FlagIcon from '@mui/icons-material/Flag';
import SendIcon from '@mui/icons-material/Send';
import PhoneIcon from '@mui/icons-material/Phone';

import { CATEGORIA_MAP, ESTATUS_MAP } from '@/config/categorias';
import { PRIORIDADES, PRIORIDAD_MAP } from '@/hooks/useOrdenesTrabajo';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useAuth } from '@/contexts/AuthContext';
import { TRANSICIONES_ESTADO, RESPUESTAS_RAPIDAS } from '@/config/regladeestados';

// ── COMPONENTE DE UX PARA CAMBIO DE ESTATUS ────────────────────────────────
function SelectorEstadoUX({ reporte, onCambiarEstatus, onAgregarNota }) {
  const estadoActual = reporte?.estatus || 'Nuevo';
  const estadosPermitidos = TRANSICIONES_ESTADO[estadoActual] || [];

  const [estadoDestino, setEstadoDestino] = useState(null);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
  const [notaPersonalizada, setNotaPersonalizada] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSeleccionarOpcion = async (opcion) => {
    setOpcionSeleccionada(opcion);
    if (opcion !== 'Otra') {
      await procesarCambio(estadoDestino, opcion);
    }
  };

  const handleGuardarPersonalizado = async () => {
    if (!notaPersonalizada.trim()) return;
    await procesarCambio(estadoDestino, notaPersonalizada);
  };

  const procesarCambio = async (nuevoEstado, textoNota) => {
    setCargando(true);
    try {
      await onAgregarNota(reporte.id, textoNota);
      await onCambiarEstatus(reporte.id, nuevoEstado);
      
      setEstadoDestino(null);
      setOpcionSeleccionada(null);
      setNotaPersonalizada('');
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    } finally {
      setCargando(false);
    }
  };

  if (estadosPermitidos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 2 }}>
        Este ticket está <strong>{estadoActual.toLowerCase()}</strong> y ha finalizado su ciclo, no admite más cambios de estado.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 3, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle2" fontWeight={800} mb={2}>
        Cambiar estatus operativo
      </Typography>

      {!estadoDestino && (
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          {estadosPermitidos.map(est => {
            const config = ESTATUS_MAP[est];
            return (
              <Button
                key={est}
                variant="outlined"
                size="small"
                onClick={() => setEstadoDestino(est)}
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(config?.color || '#000', 0.5),
                  color: config?.color,
                  '&:hover': { bgcolor: config?.bg, borderColor: config?.color }
                }}
              >
                Mover a {est}
              </Button>
            );
          })}
        </Stack>
      )}

      {estadoDestino && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Razón para mover a <strong>{estadoDestino}</strong>:
            </Typography>
            <Button size="small" sx={{ fontSize: 10, minWidth: 0, p: 0.5 }} onClick={() => {
              setEstadoDestino(null);
              setOpcionSeleccionada(null);
            }}>
              (Cambiar destino)
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1, minWidth: 0 }}>
            {RESPUESTAS_RAPIDAS[estadoDestino]?.map(opcion => (
              <Chip
                key={opcion}
                label={opcion}
                onClick={() => handleSeleccionarOpcion(opcion)}
                disabled={cargando}
                sx={{
                  justifyContent: 'flex-start',
                  height: 'auto',
                  px: 0.5, py: 1.5, borderRadius: 2,
                  bgcolor: opcionSeleccionada === opcion ? alpha(ESTATUS_MAP[estadoDestino]?.color, 0.1) : 'background.default',
                  border: '1px solid',
                  borderColor: opcionSeleccionada === opcion ? ESTATUS_MAP[estadoDestino]?.color : 'divider',
                  fontWeight: opcionSeleccionada === opcion ? 700 : 500,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: ESTATUS_MAP[estadoDestino]?.color },
                  '& .MuiChip-label': {
                    display: 'block',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: 1.2
                  }
                }}
              />
            ))}
          </Box>

          {opcionSeleccionada === 'Otra' && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Escribe el motivo específico..."
                value={notaPersonalizada}
                onChange={(e) => setNotaPersonalizada(e.target.value)}
                disabled={cargando}
                autoFocus
              />
              <Button
                variant="contained"
                disabled={!notaPersonalizada.trim() || cargando}
                onClick={handleGuardarPersonalizado}
                sx={{ height: 40, bgcolor: ESTATUS_MAP[estadoDestino]?.color }}
              >
                {cargando ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ── COMPONENTE PRINCIPAL (MODAL DE DETALLE) ────────────────────────────────
export default function TicketDetalle({ reporte, open, onClose, onAgregarNota, onCambiarEstatus, onCambiarPrioridad, onAsignar }) {
  const { usuarios } = useUsuarios();
  const { user, perfil } = useAuth();
  
  const [nuevaNotaTexto, setNuevaNotaTexto] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  if (!reporte) return null;

  const categoriaInfo = CATEGORIA_MAP[reporte.categoria];
  const estatusInfo = ESTATUS_MAP[reporte.estatus ?? 'Nuevo'];
  const prioridadInfo = PRIORIDAD_MAP[reporte.prioridad ?? 0];

  const esModoKanban = onCambiarEstatus !== undefined; 
  const currentUserId = user?.uid || perfil?.id || perfil?.uid;
  const isAdmin = ['admin', 'supervisor'].includes(perfil?.rol);

  const formatFecha = (f) => {
    if (!f) return '—';
    try {
      let date;
      if (typeof f.toDate === 'function') {
        date = f.toDate();
      } else {
        date = f instanceof Date ? f : new Date(f);
      }
      if (isNaN(date.getTime())) return '—';

      return date.toLocaleString('es-MX', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute:'2-digit' 
      });
    } catch { 
      return '—'; 
    }
  };

  const handleEnviarNotaSimple = async () => {
    if (!nuevaNotaTexto.trim()) return;
    setGuardandoNota(true);
    try {
      await onAgregarNota(reporte.id, nuevaNotaTexto);
      setNuevaNotaTexto('');
    } catch (error) {
      console.error("Error", error);
    } finally {
      setGuardandoNota(false);
    }
  };

  const handleCambioAsignacion = async (nuevoAsignadoId) => {
    if (!onAsignar) return;
    const usr = usuarios.find(u => u.id === nuevoAsignadoId);
    await onAsignar(reporte.id, nuevoAsignadoId, usr ? usr.nombre : null);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      PaperProps={{ sx: { borderRadius: 4, minHeight: '80vh' } }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(categoriaInfo?.color || '#000', 0.03) }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>
              TICKET #{reporte.folio || reporte.id.slice(-6).toUpperCase()}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              {categoriaInfo?.emoji} {categoriaInfo?.label || reporte.categoria}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        
        {/* COLUMNA IZQUIERDA: DETALLES */}
        <Box sx={{ flex: 1.5, p: 3, borderRight: { md: '1px solid' }, borderColor: { md: 'divider' }, minWidth: 0 }}>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Chip 
              label={reporte.estatus || 'Nuevo'} 
              sx={{ fontWeight: 800, bgcolor: estatusInfo?.bg, color: estatusInfo?.color, borderRadius: 1.5 }} 
            />
            {esModoKanban && (
               <FormControl size="small" sx={{ minWidth: 120 }}>
                 <Select
                   value={reporte.prioridad ?? 0}
                   onChange={(e) => onCambiarPrioridad && onCambiarPrioridad(reporte.id, e.target.value)}
                   sx={{ 
                     height: 32, borderRadius: 1.5, fontSize: 13, fontWeight: 700, 
                     color: prioridadInfo?.color,
                     '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(prioridadInfo?.color || '#000', 0.3) }
                   }}
                 >
                   {PRIORIDADES.map(p => (
                     <MenuItem key={p.value} value={p.value} sx={{ fontSize: 13, fontWeight: 700, color: p.color }}>
                       <FlagIcon sx={{ fontSize: 16, mr: 1, color: p.color }}/> {p.label}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
            )}
          </Box>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">Fecha de reporte</Typography>
              <Typography variant="body2" fontWeight={600}>{formatFecha(reporte.fecha_iso || reporte.fecha)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">Área / Sector</Typography>
              <Typography variant="body2" fontWeight={600}>{categoriaInfo?.area || 'General'} • {reporte.sector || 'Sin sector'}</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={0.5}>
              <MapIcon fontSize="small" /> Ubicación
            </Typography>
            <Typography variant="body2" fontWeight={600}>{reporte.ubicacion || 'No especificada'}</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Descripción ciudadana</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {reporte.descripcion || <em>Sin descripción.</em>}
            </Typography>
          </Box>

          {reporte.foto_url && (
            <Box sx={{ mb: 3 }}>
               <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={1}>
                 <CameraAltIcon fontSize="small" /> Evidencia fotográfica
               </Typography>
               <Box 
                 component="img" 
                 src={reporte.foto_url} 
                 alt="Evidencia" 
                 sx={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
               />
            </Box>
          )}

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle2" fontWeight={800} mb={1.5} color="primary.main">
             Datos de Contacto
          </Typography>
          {reporte.anonimo ? (
             <Typography variant="body2" color="text.secondary" fontStyle="italic">Reporte anónimo.</Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Nombre</Typography>
                <Typography variant="body2" fontWeight={600}>{reporte.nombre || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                  <PhoneIcon fontSize="inherit" /> Teléfono
                </Typography>
                <Typography variant="body2" fontWeight={600}>{reporte.telefono || '—'}</Typography>
              </Box>
            </Box>
          )}

        </Box>

        {/* COLUMNA DERECHA: GESTIÓN OPERATIVA */}
        <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', bgcolor: 'background.default', minWidth: 0 }}>
          
          {/* Asignación */}
          {esModoKanban && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
               <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={1}>
                 <AssignmentIcon fontSize="small" /> Asignado a
               </Typography>
               <FormControl fullWidth size="small">
                  <Select 
                    value={reporte.asignado_a || ''} 
                    onChange={e => handleCambioAsignacion(e.target.value)}
                    displayEmpty
                    disabled={!isAdmin && reporte.asignado_a !== currentUserId}
                  >
                    <MenuItem value=""><em>Sin asignar</em></MenuItem>
                    {(usuarios || []).filter(u => ['operador', 'admin'].includes(u.rol)).map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.nombre}</MenuItem>
                    ))}
                  </Select>
               </FormControl>
               {!isAdmin && !reporte.asignado_a && (
                 <Button size="small" variant="outlined" onClick={() => handleCambioAsignacion(currentUserId)} sx={{ mt: 1, fullWidth: true }}>
                   Asignarme este ticket
                 </Button>
               )}
            </Box>
          )}

          {/* Motor de Reglas UX */}
          {esModoKanban && (
            <SelectorEstadoUX 
              reporte={reporte} 
              onCambiarEstatus={onCambiarEstatus} 
              onAgregarNota={onAgregarNota} 
            />
          )}

          {/* Notas simples */}
          {esModoKanban && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
                Agregar nota interna rápida
              </Typography>
              <TextField 
                fullWidth multiline rows={2} size="small"
                placeholder="Comentario adicional..."
                value={nuevaNotaTexto} onChange={e => setNuevaNotaTexto(e.target.value)}
              />
              <Button 
                variant="outlined" size="small" fullWidth sx={{ mt: 1 }}
                onClick={handleEnviarNotaSimple} disabled={!nuevaNotaTexto.trim() || guardandoNota}
              >
                {guardandoNota ? 'Guardando...' : 'Agregar nota'}
              </Button>
            </Box>
          )}

          {/* Historial - ── AQUÍ SE ENCUENTRA LA CORRECCIÓN DE DESBORDAMIENTO VERTICAL ── */}
          <Box sx={{ mt: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} mb={2} display="flex" alignItems="center" gap={1}>
              <HistoryIcon fontSize="small" color="action" /> Historial de actividad
            </Typography>
            
            <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 320, pr: 1, pb: 1 }}>
              <Stack spacing={2}>
                {(reporte.actividad || []).slice().reverse().map((act, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.5 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: act.tipo === 'estado' ? 'primary.light' : act.tipo === 'nota' ? 'warning.light' : 'grey.300' }}>
                      {act.usuario?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <Typography variant="caption" fontWeight={700}>{act.usuario || 'Sistema'}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatFecha(act.fecha)}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ 
                        mt: 0.5, bgcolor: 'background.paper', p: 1, 
                        borderRadius: 2, border: '1px solid', borderColor: 'divider',
                        wordBreak: 'break-word', whiteSpace: 'pre-wrap' 
                      }}>
                        {act.mensaje || act.detalle || act.nota || act.texto || 
                          (act.tipo === 'estado' ? `Estatus actualizado a: ${act.estatus_nuevo || act.estatus || 'desconocido'}` : 'Actividad registrada')
                        }
                      </Typography>
                    </Box>
                  </Box>
                ))}
                {(!reporte.actividad || reporte.actividad.length === 0) && (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center">
                    Sin actividad registrada aún.
                  </Typography>
                )}
              </Stack>
            </Box>
          </Box>

        </Box>
      </DialogContent>
    </Dialog>
  );
}