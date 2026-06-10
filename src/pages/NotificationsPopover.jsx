// src/pages/NotificationsPopover.jsx
import React from 'react';
import {
  Box, Typography, Divider, Button, Popover, Stack, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  IconButton, Tooltip, useTheme, Badge
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

export default function NotificationsPopover({ 
  anchorEl, 
  open, 
  onClose, 
  notificaciones = [], 
  onMarcarLeida,
  onVerTodas,
  municipio,
  onClicNotificacion
}) {
  const theme = useTheme();

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        sx: {
          p: 0, mt: 1.5,
          width: { xs: 'calc(100% - 32px)', sm: 360 }, // Un poco más ancho que el de perfil
          maxHeight: 480,
          borderRadius: 3,
          boxShadow: theme.shadows[10],
          display: 'flex', flexDirection: 'column'
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Notificaciones
        </Typography>
        <Tooltip title="Marcar todas como leídas">
          <IconButton size="small" onClick={onMarcarLeida} sx={{ color: municipio?.brandColor }}>
            <DoneAllIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Lista de Notificaciones */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: 'background.neutral' }}>
        {notificaciones.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No tienes notificaciones nuevas
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notificaciones.map((notif) => (
              <ListItem 
                key={notif.id}
                button 
                onClick={() => onClicNotificacion(notif)}
                sx={{ 
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: notif.leida ? 'transparent' : `${municipio?.brandColor}05`,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: notif.leida ? 'grey.300' : `${municipio?.brandColor}20`, color: municipio?.brandColor }}>
                    {notif.icon || <NotificationsNoneIcon fontSize="small" />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                    disableTypography // <--- ¡SOLO TIENES QUE AGREGAR ESTA LÍNEA AQUÍ!
                    primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={notif.leida ? 400 : 700}>
                            {notif.titulo}
                        </Typography>
                        {!notif.leida && <FiberManualRecordIcon sx={{ fontSize: 10, color: municipio?.brandColor }} />}
                        </Box>
                    }
                    secondary={
                        <Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {notif.descripcion}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 0.5, color: 'text.disabled', fontSize: 10 }}>
                            {notif.fecha}
                        </Typography>
                        </Stack>
                    }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 1 }}>
        <Button 
          fullWidth 
          size="small" 
          onClick={() => { onVerTodas(); onClose(); }}
          sx={{ textTransform: 'none', fontWeight: 600, color: municipio?.brandColor }}
        >
          Ver todas las notificaciones
        </Button>
      </Box>
    </Popover>
  );
}