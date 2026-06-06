import React from 'react';
import {
  Box, Typography, Divider, Button, Avatar, Popover, Stack, useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function UserProfilePopover({ 
  anchorEl, 
  open, 
  onClose, 
  user, 
  perfil, 
  municipio,
  onEdit,
  onLogout 
}) {
  const theme = useTheme();

  return (
    <Popover
      id="profile-popover"
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        sx: {
          p: 0, mt: 1.5,
          width: { xs: 'calc(100% - 32px)', sm: 280 },
          borderRadius: 3,
          boxShadow: theme.shadows[10],
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`
        },
      }}
    >
      {/* Header con Color de Marca */}
      <Box sx={{ 
        bgcolor: `${municipio?.brandColor || '#000'}10`, 
        p: 2.5, pb: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
      }}>
        <Avatar
          sx={{
            bgcolor: municipio?.brandColor,
            width: 60, height: 60, fontSize: 24, fontWeight: 700, mb: 1.5,
            boxShadow: `0 4px 12px ${municipio?.brandColor}40`,
            border: `3px solid ${theme.palette.background.paper}`
          }}
        >
          {perfil?.nombre?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
          {perfil?.nombre ? `${perfil.nombre} ${perfil.apellidos || ''}` : 'Usuario'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', mt: 0.5 }}>
          {perfil?.rol_label || 'Personal'}
        </Typography>
      </Box>

      <Divider />

      {/* Cuerpo y Acciones */}
      <Box sx={{ p: 1.5 }}>
        <Stack spacing={0.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, px: 1.5 }}>
            <AccountCircleIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">Cuenta</Typography>
              <Typography variant="body2" noWrap>{user?.email}</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Button
            fullWidth
            startIcon={<EditIcon sx={{ fontSize: 18 }} />}
            onClick={() => { onEdit(); onClose(); }}
            sx={{ 
              justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2,
              fontWeight: 600, color: municipio?.brandColor,
              '&:hover': { bgcolor: `${municipio?.brandColor}08` }
            }}
          >
            Editar mi perfil
          </Button>

          <Button
            fullWidth
            color="error"
            startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
            onClick={() => { onLogout(); onClose(); }}
            sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            Cerrar sesión
          </Button>
        </Stack>
      </Box>
    </Popover>
  );
}