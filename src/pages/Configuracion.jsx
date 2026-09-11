// src/pages/Configuracion.jsx
import React, { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  List, ListItem, ListItemText, IconButton, Divider, CircularProgress, alpha, useTheme
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import RoomIcon from '@mui/icons-material/Room'
import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'

import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useMunicipio } from '@/contexts/MunicipioContext'

export default function Configuracion() {
  const theme = useTheme()
  const { municipio } = useMunicipio()
  const [zonas, setZonas] = useState([])
  const [loading, setLoading] = useState(true)

  // Estados para el modal de nueva zona
  const [modalOpen, setModalOpen] = useState(false)
  const [nuevaZonaGeojson, setNuevaZonaGeojson] = useState(null)
  const [nombreZona, setNombreZona] = useState('')

  // Estado para el modal de confirmación de eliminación (guarda el ID de la zona)
  const [zonaAEliminar, setZonaAEliminar] = useState(null)

  // Cargar zonas de Firebase en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'zonas'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setZonas(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Evento al terminar de dibujar un polígono
  const onCreated = (e) => {
    const { layerType, layer } = e
    if (layerType === 'polygon') {
      const latlngs = layer.getLatLngs()[0]
      
      // Convertimos al formato GeoJSON (longitud, latitud)
      const coordinates = latlngs.map(ll => [ll.lng, ll.lat])
      // Para cerrar el polígono en GeoJSON, el primer y último punto deben ser idénticos
      coordinates.push([latlngs[0].lng, latlngs[0].lat])

      setNuevaZonaGeojson({
        type: "Polygon",
        coordinates: [coordinates]
      })
      
      // Removemos la capa temporal del mapa; React la pintará formalmente si se guarda
      layer.remove()
      setModalOpen(true)
    }
  }

  // Guardar nueva zona en Firebase
  const handleGuardarZona = async () => {
    if (!nombreZona.trim()) return

    try {
      await addDoc(collection(db, 'zonas'), {
        nombre: nombreZona,
        color: municipio.brandColor, 
        // Convertimos el GeoJSON a String para evadir la restricción de arreglos anidados de Firestore
        geojson: JSON.stringify(nuevaZonaGeojson), 
        fecha_creacion: new Date()
      })
      setModalOpen(false)
      setNombreZona('')
      setNuevaZonaGeojson(null)
    } catch (error) {
      console.error("Error al guardar la zona:", error)
    }
  }

  // Activa el flujo de borrado abriendo el modal de MUI
  const handleClickEliminar = (id) => {
    setZonaAEliminar(id)
  }

  // Ejecuta la baja definitiva en Firestore tras confirmar
  const confirmarEliminacion = async () => {
    if (zonaAEliminar) {
      try {
        await deleteDoc(doc(db, 'zonas', zonaAEliminar))
        setZonaAEliminar(null)
      } catch (error) {
        console.error("Error al eliminar la zona:", error)
      }
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Configuración General</Typography>
        <Typography variant="body2" color="text.secondary">
          Administración del municipio, zonas operativas y ajustes del sistema.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Panel Izquierdo - Lista de Zonas */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Sectores Operativos (Zonas)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Dibuja en el mapa los diferentes cuadrantes o sectores del municipio. Estos se usarán para la analítica inteligente.
              </Typography>

              <Divider sx={{ my: 2 }} />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : zonas.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3, opacity: 0.6 }}>
                  <RoomIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2">No hay zonas configuradas</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {zonas.map(zona => (
                    <ListItem
                      key={zona.id}
                      disablePadding
                      sx={{
                        mb: 1, p: 1.5,
                        bgcolor: alpha(zona.color || theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        border: `1px solid ${alpha(zona.color || theme.palette.primary.main, 0.2)}`
                      }}
                      secondaryAction={
                        <IconButton edge="end" color="error" onClick={() => handleClickEliminar(zona.id)} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText 
                        primary={zona.nombre} 
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Panel Derecho - Mapa de Trazado */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ height: 600, position: 'relative' }}>
              <MapContainer
                center={municipio.mapCenter}
                zoom={municipio.mapZoom}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_3gio_1_24b05530968dfd66167515fb"
                />

                {/* Caja de herramientas Leaflet Draw */}
                <FeatureGroup>
                  <EditControl
                    position="topright"
                    onCreated={onCreated}
                    draw={{
                      rectangle: false,
                      polyline: false,
                      circle: false,
                      circlemarker: false,
                      marker: false,
                      polygon: {
                        allowIntersection: false,
                        drawError: {
                          color: '#e1e100',
                          message: '<strong>Error:</strong> Las líneas no se pueden cruzar.'
                        },
                        shapeOptions: {
                          color: municipio.brandColor
                        }
                      }
                    }}
                    edit={{ edit: false, remove: false }}
                  />
                </FeatureGroup>

                {/* Renderizar polígonos guardados */}
                {zonas.map(zona => {
                  let geojsonObj = null;
                  try {
                    // Reconstruimos el String guardado en base de datos a Objeto ejecutable
                    geojsonObj = typeof zona.geojson === 'string' 
                      ? JSON.parse(zona.geojson) 
                      : zona.geojson;
                  } catch (e) {
                    console.error("Error parseando geojson de zona", zona.id);
                    return null;
                  }

                  if (!geojsonObj || !geojsonObj.coordinates) return null;

                  // GeoJSON maneja [lng, lat], invertimos el orden para adecuarlo a [lat, lng] de React-Leaflet
                  const polygonPositions = geojsonObj.coordinates[0].map(coord => [coord[1], coord[0]])
                  
                  return (
                    <Polygon 
                      key={zona.id} 
                      positions={polygonPositions} 
                      color={zona.color || municipio.brandColor}
                      fillOpacity={0.2}
                      weight={2}
                    >
                      <Popup><b>{zona.nombre}</b></Popup>
                    </Polygon>
                  )
                })}
              </MapContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Modal MUI para asignar nombre al nuevo Sector */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Guardar nueva zona</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Asigna un nombre descriptivo al sector urbano que acabas de trazar (Ej. "Cuadrante Norte", "Sector Centro").
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Nombre de la zona"
            value={nombreZona}
            onChange={(e) => setNombreZona(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setModalOpen(false); setNuevaZonaGeojson(null); setNombreZona(''); }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleGuardarZona} disabled={!nombreZona.trim()} disableElevation>
            Guardar Sector
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal MUI de confirmación elegante para eliminar zonas */}
      <Dialog 
        open={!!zonaAEliminar} 
        onClose={() => setZonaAEliminar(null)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>
          Eliminar Sector
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas eliminar este sector de forma permanente? Esta acción no se puede deshacer y los reportes nuevos dejarán de clasificarse en esta área.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button 
            onClick={() => setZonaAEliminar(null)} 
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={confirmarEliminacion}
            disableElevation
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}