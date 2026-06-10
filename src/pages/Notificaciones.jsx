import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, List, ListItem, 
  ListItemAvatar, Avatar, ListItemText, Divider, 
  Button, Chip, IconButton, Tooltip, Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMunicipio } from '@/contexts/MunicipioContext';

export default function Notificaciones({ notificaciones = [], onMarcarLeida, onClicNotificacion }) {
  const navigate = useNavigate();
  const { municipio } = useMunicipio();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2, borderRadius: 2 }}
      >
        Volver al tablero
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Todas las notificaciones</Typography>
        <Button 
          variant="outlined" 
          startIcon={<DoneAllIcon />} 
          onClick={onMarcarLeida}
          sx={{ borderRadius: 2 }}
        >
          Marcar todas como leídas
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        {notificaciones.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">No hay notificaciones para mostrar.</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notificaciones.map((notif, index) => (
              <React.Fragment key={notif.id}>
                <ListItem 
                  button 
                  onClick={() => onClicNotificacion(notif)}
                  sx={{ 
                    p: 2.5,
                    bgcolor: notif.leida ? 'transparent' : `${municipio.brandColor}05`,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notif.leida ? 'grey.200' : `${municipio.brandColor}20`, color: municipio.brandColor }}>
                      {notif.icon || <NotificationsNoneIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={notif.leida ? 500 : 700}>
                          {notif.titulo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(notif.fecha), "d MMM, HH:mm", { locale: es })}
                        </Typography>
                      </Box>
                    }
                    secondary={notif.descripcion}
                  />
                </ListItem>
                {index < notificaciones.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
}