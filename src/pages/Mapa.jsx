// src/pages/Mapa.jsx
import React, { useState, useEffect, useRef } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Chip, Stack,
  ToggleButtonGroup, ToggleButton, CircularProgress, Divider // Movimos el Divider aquí arriba
} from '@mui/material'
import LayersIcon      from '@mui/icons-material/Layers'
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot'
import {
  MapContainer, TileLayer, CircleMarker, Popup, useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
// Se asume que estos imports están correctos según tu estructura
import { useReportes }  from '@/hooks/useReportes'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { CATEGORIAS, CATEGORIA_MAP, ESTATUS_MAP } from '@/config/categorias'
import FiltroTemporal   from '@/components/ui/FiltroTemporal'
import { format }       from 'date-fns'
import { es }           from 'date-fns/locale'
import L from 'leaflet'
import 'leaflet.heat'

// ── CORRECCIÓN 1: Lógica de HeatmapLayer ──
// Esta función carga y gestiona la capa de calor correctamente.
// El problema principal era que no podíamos usar useRef para guardar la *capa*
// directamente porque leaflet.heat se carga de forma asíncrona.
function HeatmapLayer({ points }) {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (!map) return

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (points?.length) {
      console.log("Renderizando calor con puntos:", points.length)

      heatLayerRef.current = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.4: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      }).addTo(map)
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
      }
    }

  }, [points, map])

  return null
}

// ── Componente marcador de leyenda ───────────────────────────
function LeyendaItem({ cat, count }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 10, height: 10, borderRadius: '50%',
        bgcolor: cat.color, flexShrink: 0,
        boxShadow: `0 0 0 2px ${cat.color}40`,
      }} />
      <Typography variant="caption" sx={{ flex: 1, fontSize: 12 }}>
        {cat.emoji} {cat.label}
      </Typography>
      <Chip label={count} size="small" sx={{
        height: 18, fontSize: 11, fontWeight: 600,
        bgcolor: cat.chipBg, color: cat.chipTxt,
      }} />
    </Box>
  )
}

export default function Mapa() {
  const [filtro, setFiltro]   = useState('mes')
  const [vista,  setVista]    = useState('marcadores')   // 'marcadores' | 'calor'
  const [catFiltro, setCatFiltro] = useState(null)       // null = todas
  const { municipio }         = useMunicipio()
  const { reportesConUbicacion, loading, stats } = useReportes(filtro)

  // Asumimos que stats() devuelve un objeto con { porCategoria: { 'id_cat': total } }
  const reporteStats = stats()
  const porCategoria = reporteStats?.porCategoria ?? {}

  const reportesFiltrados = catFiltro
    ? reportesConUbicacion.filter(r => r.categoria === catFiltro)
    : reportesConUbicacion

  const heatPoints = reportesFiltrados
    .map(r => [parseFloat(r.lat), parseFloat(r.lon), 1])
    .filter(p => !isNaN(p[0]) && !isNaN(p[1]))

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Mapa de trazabilidad</Typography>
          <Typography variant="body2" color="text.secondary">
            Distribución geográfica de reportes en {municipio.nombre}
          </Typography>
        </Box>
        <FiltroTemporal value={filtro} onChange={setFiltro} />
      </Box>

      <Grid container spacing={2}>
        {/* Panel izquierdo — controles y leyenda */}
        <Grid item xs={12} md={3}>
          <Stack spacing={2}>
            {/* Selector de vista */}
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                  Tipo de visualización
                </Typography>
                <ToggleButtonGroup
                  value={vista}
                  exclusive
                  // ── CORRECCIÓN 3: Aseguramos que 'v' no sea null ──
                  // Esto evita que el usuario 'deseleccione' la opción activa y deje el mapa vacío.
                  onChange={(_, v) => {
                    if (v !== null) setVista(v)
                  }}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiToggleButton-root': {
                      textTransform: 'none', fontSize: '0.8rem',
                      py: 0.75, fontWeight: 500,
                      '&.Mui-selected': {
                        bgcolor: municipio.brandColor,
                        color: 'white',
                        '&:hover': { bgcolor: municipio.brandColor },
                      },
                    },
                  }}
                >
                  <ToggleButton value="marcadores">
                    <ScatterPlotIcon sx={{ fontSize: 16, mr: 0.5 }} /> Marcadores
                  </ToggleButton>
                  <ToggleButton value="calor">
                    <LayersIcon sx={{ fontSize: 16, mr: 0.5 }} /> Calor
                  </ToggleButton>
                </ToggleButtonGroup>
              </CardContent>
            </Card>

            {/* Filtro por categoría */}
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                  Filtrar por categoría
                </Typography>
                <Stack spacing={0.75}>
                  <Box
                    onClick={() => setCatFiltro(null)}
                    sx={{
                      p: 0.75, borderRadius: 1.5, cursor: 'pointer',
                      bgcolor: catFiltro === null ? `${municipio.brandColor}18` : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Typography variant="caption" fontWeight={catFiltro === null ? 700 : 400}>
                      🗺️ Todas las categorías ({reportesConUbicacion.length})
                    </Typography>
                  </Box>
                  {CATEGORIAS.map(cat => {
                    const count = porCategoria[cat.firestoreValue] ?? 0
                    if (count === 0) return null
                    return (
                      <Box
                        key={cat.id}
                        onClick={() => setCatFiltro(
                          catFiltro === cat.firestoreValue ? null : cat.firestoreValue
                        )}
                        sx={{
                          p: 0.75, borderRadius: 1.5, cursor: 'pointer',
                          bgcolor: catFiltro === cat.firestoreValue ? `${cat.color}20` : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <LeyendaItem cat={cat} count={count} />
                      </Box>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>

            {/* Totales */}
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary">Reportes con ubicación</Typography>
                <Typography variant="h5" fontWeight={700}>
                  {loading ? <CircularProgress size={20} /> : reportesConUbicacion.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  de {porCategoria['total'] ?? reportesConUbicacion.length} totales {/* Ajuste leve en stats */}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Mapa */}
        <Grid item xs={12} md={9}>
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ height: { xs: 400, md: 580 }, position: 'relative' }}>
              {loading && (
                <Box sx={{
                  position: 'absolute', inset: 0, zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.7)',
                }}>
                  <CircularProgress />
                </Box>
              )}
              <MapContainer
                center={municipio.mapCenter}
                zoom={municipio.mapZoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                {/* ── CORRECCIÓN OPCIONAL: Diseño del mapa ── */}
                {/* He cambiado el diseño por defecto de OpenStreetMap por uno más limpio (Positron)
                    que hace resaltar mucho más tus puntos de calor y marcadores. */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_3gio_1_24b05530968dfd66167515fb"
                />

                {/* Vista de Marcadores (Condicional) */}
                {vista === 'marcadores' && reportesFiltrados.map(r => {
                  const lat = parseFloat(r.lat)
                  const lon = parseFloat(r.lon)
                  if (isNaN(lat) || isNaN(lon)) return null
                  const cat    = CATEGORIA_MAP[r.categoria] ?? CATEGORIA_MAP['Otro']
                  const estatus = ESTATUS_MAP[r.estatus] ?? ESTATUS_MAP['Nuevo']
                  return (
                    <CircleMarker
                      key={r.id}
                      center={[lat, lon]}
                      radius={8}
                      fillColor={cat.color}
                      color="#fff"
                      weight={2}
                      opacity={1}
                      fillOpacity={0.85}
                    >
                      <Popup maxWidth={260}>
                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: cat.color }}>
                            {cat.emoji} {cat.label}
                          </Typography>
                          {r.subtipo && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {r.subtipo}
                            </Typography>
          )}
                          {/* Divider movido al scope correcto arriba */}
                          <Divider sx={{ my: 0.75 }} />
                          <Typography variant="caption" display="block"><b>Folio:</b> {r.folio}</Typography>
                          <Typography variant="caption" display="block"><b>Ubicación:</b> {r.ubicacion}</Typography>
                          <Typography variant="caption" display="block">
                            <b>Fecha:</b> {r.fecha ? format(r.fecha, "d 'de' MMMM, HH:mm", { locale: es }) : '—'}
                          </Typography>
                          <Box sx={{ mt: 0.75 }}>
                            <Chip
                              label={r.estatus ?? 'Nuevo'}
                              size="small"
                              sx={{
                                height: 18, fontSize: 10, fontWeight: 600,
                                bgcolor: estatus.bg, color: estatus.color,
                              }}
                            />
                          </Box>
                          {r.foto_url && (
                            <Box
                              component="img"
                              src={r.foto_url}
                              alt="Foto del reporte"
                              sx={{ width: '100%', borderRadius: 1, mt: 1, maxHeight: 120, objectFit: 'cover' }}
                            />
                          )}
                        </Box>
                      </Popup>
                    </CircleMarker>
                  )
                })}

                {/* Vista de Calor (Condicional) */}
                {/* ── CORRECCIÓN 4: Renderizado Condicional del Mapa de Calor ── */}
                {/* Ahora el componente HeatmapLayer solo existe en el árbol de renderizado
                    cuando 'vista' es 'calor'. Su useEffect interno se encargará de añadirlo
                    y, lo más importante, SU FUNCIÓN DE LIMPIEZA lo eliminará cuando cambies de vista. */}
                {vista === 'calor' && <HeatmapLayer points={heatPoints} />}
              </MapContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}