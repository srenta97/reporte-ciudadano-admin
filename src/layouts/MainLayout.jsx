// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Divider, Chip, Tooltip, useTheme, useMediaQuery, Badge
} from '@mui/material'
import MenuIcon            from '@mui/icons-material/Menu'
import DashboardIcon       from '@mui/icons-material/Dashboard'
import MapIcon             from '@mui/icons-material/Map'
import AssignmentIcon      from '@mui/icons-material/Assignment'
import LogoutIcon          from '@mui/icons-material/Logout'
import NotificationsIcon   from '@mui/icons-material/NotificationsNone'
import BusinessIcon        from '@mui/icons-material/Business'
import PeopleIcon          from '@mui/icons-material/PeopleAlt'
import { useAuth }         from '@/contexts/AuthContext'
import { useMunicipio }    from '@/contexts/MunicipioContext'
import DescriptionIcon from '@mui/icons-material/Description'
import WorkIcon from '@mui/icons-material/WorkOutline'
import UserProfilePopover from '@/pages/UserProfilePopover';
import NotificationsPopover from '@/pages/NotificationsPopover';
import { useNotifications } from '@/hooks/useNotifications';
import BuscadorGlobal from '@/components/ui/BuscadorGlobal'
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import TicketDetalle from '@/components/tickets/TicketDetalle';
import AddBoxIcon from '@mui/icons-material/AddBoxOutlined'

const DRAWER_WIDTH = 260

const NAV_ITEMS = [
  { label: 'General',       icon: <DashboardIcon />,    path: '/dashboard',   rol: null },
  { label: 'Nuevo reporte', icon: <AddBoxIcon />,       path: '/nuevo-reporte', rol: 'operador' },
  { label: 'Órdenes de trabajo', icon: <WorkIcon />,    path: '/ordenes',     rol: 'operador' },
  { label: 'Gestión',       icon: <AssignmentIcon />,   path: '/gestion',     rol: 'admin' },
  { label: 'Archivo',       icon: <DescriptionIcon />,  path: '/reportes',    rol: null },
  { label: 'Mapa',          icon: <MapIcon />,          path: '/mapa',        rol: null },
  { label: 'Usuarios',      icon: <PeopleIcon />,       path: '/usuarios',    rol: 'admin' },  
]

export default function MainLayout() {
  const theme     = useTheme()
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(!isMobile)
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, perfil, logout, esOperador, esAdmin } = useAuth()
  const { municipio } = useMunicipio()
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [ticketActivoGlobal, setTicketActivoGlobal] = useState(null);

  const { 
    notificaciones, 
    noLeidasCount, 
    marcarTodasComoLeidas,
    marcarComoLeida 
  } = useNotifications();

  const items = NAV_ITEMS.filter(item =>
    !item.rol ||
    (item.rol === 'operador' && esOperador) ||
    (item.rol === 'admin' && esAdmin)
  )

  const DrawerContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo + nombre municipio */}
      <Box sx={{
        p: 3, display: 'flex', alignItems: 'center', gap: 1.5,
        background: `linear-gradient(135deg, ${municipio.brandColor} 0%, ${municipio.brandColor}CC 100%)`,
        color: 'white',
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, 
          bgcolor: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img 
            src="/img/logo-municipio.svg" 
            alt="Logo Municipio" 
            style={{ 
              width: '100%',
              height: '100%',
            }} 
          />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ color: 'white', lineHeight: 1.2, fontWeight: 700 }}>
            {municipio.nombre}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
            {municipio.estado} · Panel Admin
          </Typography>
        </Box>
      </Box>

      {/* Navegación */}
      <List sx={{ flex: 1, pt: 2, px: 1.5 }}>
        {items.map(item => {
          const active = location.pathname === item.path
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); if (isMobile) setOpen(false) }}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  bgcolor: active ? `${municipio.brandColor}18` : 'transparent',
                  '&:hover': { bgcolor: `${municipio.brandColor}12` },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 38,
                  color: active ? municipio.brandColor : 'text.secondary',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 600 : 400,
                    color: active ? municipio.brandColor : 'text.primary',
                    fontSize: '0.9rem',
                  }}
                />
                {active && (
                  <Box sx={{
                    width: 4, height: 24, borderRadius: 2,
                    bgcolor: municipio.brandColor, ml: 1,
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider />

      {/* Perfil usuario */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: municipio.brandColor, width: 36, height: 36, fontSize: 14 }}>
          {user?.email?.[0]?.toUpperCase() ?? 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontSize: 13 }}>
            {user?.displayName ?? user?.email?.split('@')[0]}
          </Typography>
          <Chip
            label={perfil?.rol ?? 'visor'}
            size="small"
            sx={{
              height: 18, fontSize: 10, fontWeight: 600,
              bgcolor: `${municipio.brandColor}18`,
              color: municipio.brandColor,
            }}
          />
        </Box>
        <Tooltip title="Cerrar sesión">
          <IconButton onClick={logout} size="small" sx={{ color: 'text.secondary' }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  useEffect(() => {
    // 1. Solicitar permiso para Notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 2. Truco para desbloquear el audio
    const desbloquearAudio = () => {
      const audio = new Audio('/sounds/notificacion.mp3'); 
      audio.volume = 0; 
      audio.play().catch(() => {});
      document.removeEventListener('click', desbloquearAudio);
    };

    document.addEventListener('click', desbloquearAudio, { once: true });

    return () => document.removeEventListener('click', desbloquearAudio);
  }, []); 

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH, boxSizing: 'border-box',
          },
        }}
      >
        <DrawerContent />
      </Drawer>

      {/* Contenido principal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'nowrap', // <-- CORRECCIÓN: Evita que los elementos salten de línea
            gap: { xs: 1, sm: 2 }, 
            px: { xs: 1, sm: 2 } 
          }}>
            {/* SECCIÓN IZQUIERDA: Menú hamburguesa */}
            <IconButton onClick={() => setOpen(o => !o)} edge="start" sx={{ flexShrink: 0 }}>
              <MenuIcon />
            </IconButton>

            {/* SECCIÓN BUSCADOR: Contenedor flexible */}
            <Box sx={{ 
              flex: 1, 
              minWidth: 0, // <-- CORRECCIÓN: Permite que el buscador se encoja
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <BuscadorGlobal /> 
            </Box>

            {/* SECCIÓN DERECHA: Notificaciones y Perfil */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 0.5, sm: 1 }, 
              flexShrink: 0, // <-- CORRECCIÓN: Evita que los iconos se aplasten
              ml: 'auto' 
            }}>
              <Tooltip title="Notificaciones">
                <IconButton color="inherit" onClick={(e) => setAnchorElNotif(e.currentTarget)}>
                  <Badge badgeContent={noLeidasCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar
                  sx={{
                    bgcolor: municipio.brandColor,
                    width: 34, height: 34, fontSize: 13,
                  }}
                >
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </Avatar>
              </IconButton>
            </Box>

            {/* Popovers y Modales */}
            <NotificationsPopover
              anchorEl={anchorElNotif}
              open={Boolean(anchorElNotif)}
              onClose={() => setAnchorElNotif(null)}
              notificaciones={notificaciones}
              municipio={municipio}
              onMarcarLeida={marcarTodasComoLeidas}
              onVerTodas={() => navigate('/notificaciones')}
              onClicNotificacion={async (notif) => {
                marcarComoLeida(notif.id);
                setAnchorElNotif(null);
                if (notif.reporte_id) {
                  try {
                    const docRef = doc(db, 'reportes', notif.reporte_id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                      setTicketActivoGlobal({ id: docSnap.id, ...docSnap.data() });
                    } else {
                      console.warn("El ticket ya no existe");
                    }
                  } catch (error) {
                    console.error("Error al obtener el ticket:", error);
                  }
                }
              }}
            />
            <TicketDetalle
              reporte={ticketActivoGlobal}
              open={!!ticketActivoGlobal}
              onClose={() => setTicketActivoGlobal(null)}
              onAgregarNota={() => console.log('Editar desde vista global no disponible')}
              onCambiarEstatus={() => console.log('Editar desde vista global no disponible')}
              onCambiarPrioridad={() => console.log('Editar desde vista global no disponible')}
              onAsignar={() => console.log('Editar desde vista global no disponible')}
            />
            <UserProfilePopover
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              user={user}
              perfil={perfil}
              municipio={municipio}
              onEdit={() => navigate('/editar-perfil')}
              onLogout={logout}
            />
          </Toolbar>
        </AppBar>

        {/* Página actual */}
        <Box
          component="main"
          sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}