// src/components/tickets/TicketCard.jsx
import React from 'react'
import { Box, Typography, Chip, Stack, Avatar, Tooltip } from '@mui/material'
import FlagIcon        from '@mui/icons-material/Flag'
import PhotoIcon       from '@mui/icons-material/PhotoCamera'
import LocationIcon    from '@mui/icons-material/LocationOn'
import CommentIcon     from '@mui/icons-material/ChatBubbleOutline'
import AccessTimeIcon  from '@mui/icons-material/AccessTime'
import { CATEGORIA_MAP } from '@/config/categorias'
import { PRIORIDAD_MAP } from '@/hooks/useOrdenesTrabajo'

function diasTranscurridos(reporte) {
  try {
    const d = reporte.fecha instanceof Date ? reporte.fecha : new Date(reporte.fecha_iso)
    return Math.floor((Date.now() - d.getTime()) / 86400000)
  } catch { return null }
}

export default function TicketCard({ reporte, onClick }) {
  const cat      = CATEGORIA_MAP[reporte.categoria]
  const prioridad = PRIORIDAD_MAP[reporte.prioridad]
  const dias      = diasTranscurridos(reporte)
  const notas     = (reporte.actividad ?? []).filter(a => a.tipo === 'nota').length
  const esUrgente = dias !== null && dias > 7 && reporte.estatus !== 'Resuelto'

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderRadius: 2,
        p: 1.75,
        cursor: 'pointer',
        transition: 'all 0.12s',
        '&:hover': {
          borderColor: cat?.color ?? 'primary.main',
          borderLeftColor: cat?.color ?? 'primary.main',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      {/* Header: folio + prioridad */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 10 }}>
          {reporte.folio ?? '—'}
        </Typography>
        {prioridad && (
          <Chip
            icon={<FlagIcon style={{ fontSize: 10, color: prioridad.color }} />}
            label={prioridad.label}
            size="small"
            sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: prioridad.bg, color: prioridad.color, '& .MuiChip-icon': { ml: 0.5 } }}
          />
        )}
      </Box>

      {/* Categoría */}
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, lineHeight: 1.3 }}>
        {cat ? `${cat.emoji} ${cat.label}` : reporte.categoria ?? 'Sin categoría'}
      </Typography>

      {/* Subtipo */}
      {reporte.subtipo && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
          {reporte.subtipo}
        </Typography>
      )}

      {/* Ubicación */}
      {reporte.ubicacion && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1 }}>
          <LocationIcon sx={{ fontSize: 12, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary"
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
            {reporte.ubicacion}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        {/* Metadatos izquierda */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Días abierto */}
          {dias !== null && (
            <Tooltip title={`Abierto hace ${dias} día${dias !== 1 ? 's' : ''}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <AccessTimeIcon sx={{ fontSize: 11, color: esUrgente ? 'error.main' : 'text.secondary' }} />
                <Typography variant="caption"
                  sx={{ fontSize: 10, color: esUrgente ? 'error.main' : 'text.secondary', fontWeight: esUrgente ? 700 : 400 }}>
                  {dias}d
                </Typography>
              </Box>
            </Tooltip>
          )}
          {/* Foto */}
          {reporte.tiene_foto === 'si' && (
            <Tooltip title="Tiene foto adjunta">
              <PhotoIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            </Tooltip>
          )}
          {/* Notas */}
          {notas > 0 && (
            <Tooltip title={`${notas} nota${notas !== 1 ? 's' : ''}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <CommentIcon sx={{ fontSize: 11, color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>{notas}</Typography>
              </Box>
            </Tooltip>
          )}
        </Stack>

        {/* Asignado a */}
        {reporte.asignado_nombre && (
          <Tooltip title={`Asignado a ${reporte.asignado_nombre}`}>
            <Avatar sx={{ width: 20, height: 20, fontSize: 9, bgcolor: '#64748B' }}>
              {reporte.asignado_nombre[0]?.toUpperCase()}
            </Avatar>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}
