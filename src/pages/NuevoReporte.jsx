// src/pages/NuevoReporte.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Stack, Divider,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Button, Chip, IconButton, Tooltip, Alert, CircularProgress,
  Avatar, ToggleButtonGroup, ToggleButton, InputAdornment
} from '@mui/material'
import UploadIcon       from '@mui/icons-material/UploadFileOutlined'
import DeleteIcon       from '@mui/icons-material/DeleteOutline'
import LocationIcon     from '@mui/icons-material/PinDropOutlined'
import EditLocationIcon from '@mui/icons-material/EditLocationAlt'
import TextIcon         from '@mui/icons-material/TextFields'
import CheckIcon        from '@mui/icons-material/CheckCircle'
import FlagIcon         from '@mui/icons-material/Flag'
import RestartAltIcon   from '@mui/icons-material/RestartAlt'
import SendIcon         from '@mui/icons-material/Send'
import SearchIcon       from '@mui/icons-material/Search' // <-- NUEVO
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet' // <-- Agregado useMap
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate }    from 'react-router-dom'
import { useMunicipio }   from '@/contexts/MunicipioContext'
import { useAuth }        from '@/contexts/AuthContext'
import { useUsuarios }    from '@/hooks/useUsuarios'
import { CATEGORIAS, CATEGORIA_MAP, SUBTIPOS } from '@/config/categorias'
import { PRIORIDADES }    from '@/hooks/useOrdenesTrabajo'
import { crearReporteManual, subirFoto } from '@/services/reportesService'

// ── Imports de Firebase para obtener las zonas ────────────────
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

// ── Fix del ícono de Leaflet en Vite ──────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Componente auxiliar para re-centrar el mapa ───────────────
function ChangeMapView({ lat, lon }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([parseFloat(lat), parseFloat(lon)], 16, { animate: true })
    }
  }, [lat, lon, map])
  return null
}

// ── Selector de ubicación en el mapa ─────────────────────────
function MapaSelector({ lat, lon, onChange, centro }) {
  function ClickHandler() {
    useMapEvents({
      click(e) {
        onChange(
          e.latlng.lat.toFixed(6),
          e.latlng.lng.toFixed(6),
        )
      },
    })
    return null
  }

  return (
    <Box sx={{ height: 280, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <MapContainer
        center={lat && lon ? [parseFloat(lat), parseFloat(lon)] : centro}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeMapView lat={lat} lon={lon} />
        <ClickHandler />
        {lat && lon && (
          <Marker position={[parseFloat(lat), parseFloat(lon)]} />
        )}
      </MapContainer>
    </Box>
  )
}

// ── Vista previa del folio generado ──────────────────────────
function VistaPreviaReporte({ datos, municipio }) {
  const cat = CATEGORIA_MAP[datos.categoria]
  return (
    <Box sx={{
      p: 2.5, borderRadius: 2,
      border: '1.5px solid', borderColor: `${municipio.brandColor}40`,
      bgcolor: `${municipio.brandColor}06`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Avatar sx={{ bgcolor: municipio.brandColor, width: 32, height: 32, fontSize: 14 }}>
          {cat?.emoji ?? '📋'}
        </Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Nuevo reporte — vista previa
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {cat ? `${cat.label}` : datos.categoria || '—'}
            {datos.subtipo ? ` · ${datos.subtipo}` : ''}
          </Typography>
        </Box>
      </Box>

      <Stack spacing={0.75}>
        {datos.ubicacion && (
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Ubicación</Typography>
            <Typography variant="caption" fontWeight={500}>{datos.ubicacion}</Typography>
          </Box>
        )}
        {(datos.lat && datos.lon) && (
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Coordenadas</Typography>
            <Typography variant="caption" fontWeight={500}>{datos.lat}, {datos.lon}</Typography>
          </Box>
        )}
        {/* NUEVO: Mostrar el sector calculado en la vista previa */}
        {datos.sector && (
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Sector / Zona</Typography>
            <Typography variant="caption" fontWeight={700} color="primary.main">{datos.sector}</Typography>
          </Box>
        )}
        {datos.telefono && (
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Teléfono</Typography>
            <Typography variant="caption" fontWeight={500}>{datos.telefono}</Typography>
          </Box>
        )}
        {datos.prioridad && (
          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Prioridad</Typography>
            <Chip
              icon={<FlagIcon style={{ fontSize: 11 }} />}
              label={PRIORIDADES.find(p => p.value === datos.prioridad)?.label ?? datos.prioridad}
              size="small"
              sx={{
                height: 18, fontSize: 10, fontWeight: 700,
                bgcolor: PRIORIDADES.find(p => p.value === datos.prioridad)?.bg,
                color:   PRIORIDADES.find(p => p.value === datos.prioridad)?.color,
              }}
            />
          </Box>
        )}
        {datos.descripcion && (
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Descripción</Typography>
            <Typography variant="caption" fontWeight={500} sx={{
              overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {datos.descripcion}
            </Typography>
          </Box>
        )}
        {datos.fotoNombre && (
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Foto</Typography>
            <Typography variant="caption" fontWeight={500} color="success.main">✅ {datos.fotoNombre}</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

// ── Función Matemática: Ray-Casting Algorithm ─────────────────
function pointInPolygon(point, polygon) {
  let x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][0], yi = polygon[i][1];
    let xj = polygon[j][0], yj = polygon[j][1];
    let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Página principal ──────────────────────────────────────────
export default function NuevoReporte() {
  const navigate          = useNavigate()
  const { municipio }     = useMunicipio()
  const { perfil, esAdmin } = useAuth()
  const { usuarios }      = useUsuarios()
  const operadores        = usuarios.filter(u => ['operador','admin'].includes(u.rol) && u.activo !== false)

  // Estado del formulario
  const [categoria,    setCategoria]    = useState('')
  const [subtipo,      setSubtipo]      = useState('')
  const [descripcion,  setDescripcion]  = useState('')
  const [ubicacion,    setUbicacion]    = useState('')
  const [lat,          setLat]          = useState('')
  const [lon,          setLon]          = useState('')
  const [telefono,     setTelefono]     = useState('')
  const [prioridad,    setPrioridad]    = useState('')
  const [asignadoA,    setAsignadoA]    = useState('')
  const [asignadoNombre, setAsignadoNombre] = useState('')
  const [foto,         setFoto]         = useState(null)        // File object
  const [fotoPreview,  setFotoPreview]  = useState('')          // URL local
  const [modoUbicacion, setModoUbicacion] = useState('texto')   // 'texto' | 'mapa'
  
  // NUEVOS ESTADOS: Geocodificación y Sectores
  const [buscandoDir,  setBuscandoDir]  = useState(false)
  const [zonasDisponibles, setZonasDisponibles] = useState([])
  const [sectorCalculado, setSectorCalculado] = useState('Sin asignar')

  // Estado de envío
  const [enviando,     setEnviando]     = useState(false)
  const [error,        setError]        = useState('')
  const [exito,        setExito]        = useState(null)        // { folio, id }

  const fileInputRef = useRef(null)

  const subtipoCat = CATEGORIA_MAP[categoria]
  const subtiposDisponibles = SUBTIPOS[categoria] ?? []

  // ── EFECTO: Cargar zonas desde Firebase al inicio ────────────
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'zonas'));
        const zonas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setZonasDisponibles(zonas);
      } catch (err) {
        console.error("Error cargando zonas:", err);
      }
    };
    fetchZonas();
  }, []);

  // ── EFECTO: Calcular sector al cambiar latitud y longitud ────
  useEffect(() => {
    if (!lat || !lon || zonasDisponibles.length === 0) {
      setSectorCalculado('Sin asignar');
      return;
    }
    
    let sectorEncontrado = 'Sin asignar';
    const punto = [parseFloat(lon), parseFloat(lat)]; // Formato GeoJSON: [Lng, Lat]

    for (const z of zonasDisponibles) {
      try {
        const geojsonObj = typeof z.geojson === 'string' ? JSON.parse(z.geojson) : z.geojson;
        if (geojsonObj && geojsonObj.coordinates) {
          if (pointInPolygon(punto, geojsonObj.coordinates[0])) {
            sectorEncontrado = z.nombre;
            break;
          }
        }
      } catch(e) { console.error("Error parseando zona", z.nombre) }
    }
    setSectorCalculado(sectorEncontrado);
  }, [lat, lon, zonasDisponibles]);

  // ── FUNCIÓN: Buscar dirección (Geocodificación OpenStreetMap) ──
  const handleBuscarDireccion = async () => {
    if (!ubicacion.trim()) return;
    setBuscandoDir(true);
    setError('');
    
    try {
      // Hacemos la búsqueda más precisa agregando el municipio y estado
      const query = `${ubicacion}, ${municipio.nombre}, ${municipio.estado}, México`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data && data.length > 0) {
        setLat(parseFloat(data[0].lat).toFixed(6));
        setLon(parseFloat(data[0].lon).toFixed(6));
        setModoUbicacion('mapa'); // Cambiamos a vista mapa para que el usuario vea el pin
      } else {
        setError('No se encontraron coordenadas para esta dirección. Intenta ser más específico o usa el mapa.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de red al intentar buscar la dirección.');
    } finally {
      setBuscandoDir(false);
    }
  };

  const handleCategoria = (value) => {
    setCategoria(value)
    setSubtipo('')
  }

  const handleFoto = (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (archivo.size > 10 * 1024 * 1024) {
      setError('La foto no debe superar 10 MB.')
      return
    }
    setFoto(archivo)
    setFotoPreview(URL.createObjectURL(archivo))
    setError('')
  }

  const handleQuitarFoto = () => {
    setFoto(null)
    setFotoPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleMapClick = useCallback((newLat, newLon) => {
    setLat(newLat)
    setLon(newLon)
  }, [])

  const handleAsignar = (uid) => {
    setAsignadoA(uid)
    const op = operadores.find(u => u.id === uid)
    setAsignadoNombre(op?.nombre ?? '')
  }

  const camposObligatorios = categoria && ubicacion
  const puedeEnviar = camposObligatorios && !enviando

  const handleSubmit = async () => {
    if (!puedeEnviar) {
      setError('Por favor selecciona una categoría y escribe la ubicación.')
      return
    }
    setError('')
    setEnviando(true)

    try {
      let fotoUrl = ''
      if (foto) {
        fotoUrl = await subirFoto(foto, 'tmp', municipio.coleccionReportes)
      }

      const { folio, id } = await crearReporteManual({
        coleccion:      municipio.coleccionReportes,
        categoria,
        subtipo,
        descripcion,
        ubicacion,
        lat,
        lon,
        sector:         sectorCalculado, // <-- NUEVO: Guardamos el sector calculado
        fotoUrl,
        tieneFoto:      !!foto,
        telefono,
        prioridad,
        asignadoA,
        asignadoNombre,
        autorNombre:    perfil?.nombre ?? perfil?.email ?? 'Panel administrativo',
        estatus:        'Nuevo',
      })

      setExito({ folio, id })
    } catch (err) {
      console.error('Error al crear reporte:', err)
      setError(`Error al crear el reporte: ${err.message}`)
    } finally {
      setEnviando(false)
    }
  }

  const handleNuevo = () => {
    setCategoria(''); setSubtipo(''); setDescripcion('')
    setUbicacion(''); setLat(''); setLon(''); setSectorCalculado('Sin asignar')
    setTelefono(''); setPrioridad(''); setAsignadoA(''); setAsignadoNombre('')
    setFoto(null); setFotoPreview('')
    setError(''); setExito(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (exito) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', pt: 4 }}>
        <Card>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              bgcolor: '#D1FAE5', mx: 'auto', mb: 2.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckIcon sx={{ fontSize: 36, color: '#059669' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} mb={0.5}>
              Reporte creado exitosamente
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              El reporte fue registrado en el sistema y está disponible en el panel.
            </Typography>

            <Box sx={{
              p: 2, borderRadius: 2,
              bgcolor: `${municipio.brandColor}10`,
              border: '1px solid', borderColor: `${municipio.brandColor}30`,
              mb: 3,
            }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Número de folio
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: municipio.brandColor, fontFamily: 'monospace' }}>
                {exito.folio}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleNuevo}
                sx={{ borderRadius: 2 }}
              >
                Crear otro reporte
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/gestion')}
                sx={{ borderRadius: 2, bgcolor: municipio.brandColor }}
              >
                Ir a gestión
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Nuevo reporte</Typography>
        <Typography variant="body2" color="text.secondary">
          Crea un reporte manualmente · {municipio.nombre}
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>

            {/* Sección 1: Categoría */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                  1. Tipo de incidencia
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Selecciona la categoría y el tipo de problema específico
                </Typography>

                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 1, mb: 2,
                }}>
                  {CATEGORIAS.map(cat => (
                    <Box
                      key={cat.id}
                      onClick={() => handleCategoria(cat.firestoreValue)}
                      sx={{
                        p: 1.25, borderRadius: 2, cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: categoria === cat.firestoreValue ? cat.color : 'divider',
                        bgcolor: categoria === cat.firestoreValue ? `${cat.color}12` : 'background.paper',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 0.5, textAlign: 'center',
                        transition: 'all 0.12s',
                        '&:hover': {
                          borderColor: cat.color,
                          bgcolor: `${cat.color}08`,
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: 22 }}>{cat.emoji}</Typography>
                      <Typography variant="caption" fontWeight={600}
                        sx={{ color: categoria === cat.firestoreValue ? cat.color : 'text.primary', lineHeight: 1.2 }}>
                        {cat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {subtiposDisponibles.length > 0 && (
                  <Box sx={{ mt: 3, pt: 3, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                      ¿Qué tipo de problema específico es?
                    </Typography>
                    
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: 1,
                    }}>
                      {/* Tile de opción General */}
                      <Box
                        onClick={() => setSubtipo('')}
                        sx={{
                          p: 1.5, borderRadius: 2, cursor: 'pointer',
                          border: '1.5px solid',
                          borderColor: subtipo === '' ? subtipoCat.color : 'divider',
                          bgcolor: subtipo === '' ? `${subtipoCat.color}12` : 'background.paper',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                          transition: 'all 0.12s',
                          '&:hover': {
                            borderColor: subtipoCat.color,
                            bgcolor: `${subtipoCat.color}08`,
                          },
                        }}
                      >
                        <Typography variant="caption" fontWeight={subtipo === '' ? 700 : 500}
                          sx={{ color: subtipo === '' ? subtipoCat.color : 'text.secondary', lineHeight: 1.2 }}>
                          General / No especificado
                        </Typography>
                      </Box>

                      {/* Tiles de los subtipos específicos */}
                      {subtiposDisponibles.map(s => (
                        <Box
                          key={s}
                          onClick={() => setSubtipo(s)}
                          sx={{
                            p: 1.5, borderRadius: 2, cursor: 'pointer',
                            border: '1.5px solid',
                            borderColor: subtipo === s ? subtipoCat.color : 'divider',
                            bgcolor: subtipo === s ? `${subtipoCat.color}12` : 'background.paper',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                            transition: 'all 0.12s',
                            '&:hover': {
                              borderColor: subtipoCat.color,
                              bgcolor: `${subtipoCat.color}08`,
                            },
                          }}
                        >
                          <Typography variant="caption" fontWeight={subtipo === s ? 700 : 500}
                            sx={{ color: subtipo === s ? subtipoCat.color : 'text.primary', lineHeight: 1.2 }}>
                            {s}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Sección 2: Ubicación */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    2. Ubicación
                  </Typography>
                  <ToggleButtonGroup
                    value={modoUbicacion} exclusive size="small"
                    onChange={(_, v) => v && setModoUbicacion(v)}
                    sx={{
                      '& .MuiToggleButton-root': {
                        textTransform: 'none', fontSize: '0.75rem', py: 0.5, px: 1.25,
                        '&.Mui-selected': {
                          bgcolor: municipio.brandColor, color: 'white',
                          '&:hover': { bgcolor: municipio.brandColor },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="texto">
                      <TextIcon sx={{ fontSize: 14, mr: 0.5 }} />Texto
                    </ToggleButton>
                    <ToggleButton value="mapa">
                      <EditLocationIcon sx={{ fontSize: 14, mr: 0.5 }} />Mapa
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Escribe la dirección. Usa la lupa para ubicarla en el mapa automáticamente.
                </Typography>

                {/* NUEVO: Campo de texto con botón de Búsqueda Geográfica */}
                <TextField
                  label="Dirección o referencia"
                  value={ubicacion}
                  onChange={e => setUbicacion(e.target.value)}
                  placeholder="Ej. Calle Reforma #25, frente a la escuela"
                  fullWidth size="small"
                  multiline={modoUbicacion !== 'mapa'} 
                  rows={modoUbicacion !== 'mapa' ? 2 : 1}
                  sx={{ mb: modoUbicacion === 'mapa' ? 2 : 0 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Buscar coordenadas en el mapa">
                          <span>
                            <IconButton 
                              onClick={handleBuscarDireccion} 
                              disabled={buscandoDir || !ubicacion.trim()}
                              color="primary"
                              edge="end"
                            >
                              {buscandoDir ? <CircularProgress size={20} /> : <SearchIcon />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBuscarDireccion(); } }}
                />

                {modoUbicacion === 'mapa' && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      También puedes hacer clic en el mapa para marcar o afinar la ubicación exacta
                    </Typography>
                    <MapaSelector
                      lat={lat} lon={lon}
                      onChange={handleMapClick}
                      centro={municipio.mapCenter}
                    />
                    {lat && lon && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />
                        <Typography variant="caption" color="success.main">
                          Coordenadas: {lat}, {lon}
                        </Typography>
                        {/* Etiqueta visible de la zona asignada */}
                        <Chip 
                          label={`Sector: ${sectorCalculado}`} 
                          size="small" 
                          variant="outlined" 
                          color={sectorCalculado !== 'Sin asignar' ? 'primary' : 'default'}
                          sx={{ height: 20, fontSize: 10, ml: 1 }} 
                        />
                        <Button size="small" sx={{ fontSize: 11, py: 0, minWidth: 0, ml: 'auto' }}
                          onClick={() => { setLat(''); setLon(''); setSectorCalculado('Sin asignar') }}>
                          Limpiar
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Sección 3: Descripción y foto */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                  3. Descripción y evidencia
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Agrega detalles del problema y opcionalmente una foto de evidencia
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Descripción del problema"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Describe el problema con el mayor detalle posible..."
                    fullWidth size="small" multiline rows={3}
                  />

                  <Box>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFoto}
                      style={{ display: 'none' }}
                    />
                    {!fotoPreview ? (
                      <Box
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          border: '2px dashed', borderColor: 'divider',
                          borderRadius: 2, p: 3,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 1,
                          cursor: 'pointer', transition: 'all 0.12s',
                          '&:hover': { borderColor: municipio.brandColor, bgcolor: `${municipio.brandColor}06` },
                        }}
                      >
                        <UploadIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Haz clic para adjuntar una foto
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          JPG, PNG, WEBP · máx. 10 MB
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={fotoPreview}
                          alt="Foto adjunta"
                          sx={{
                            width: '100%', maxHeight: 220, objectFit: 'cover',
                            borderRadius: 2, display: 'block',
                          }}
                        />
                        <Box sx={{
                          position: 'absolute', top: 8, right: 8,
                          display: 'flex', gap: 0.5,
                        }}>
                          <Tooltip title="Quitar foto">
                            <IconButton
                              size="small" onClick={handleQuitarFoto}
                              sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                          📎 {foto?.name}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <TextField
                    label="Teléfono del ciudadano (opcional)"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    placeholder="10 dígitos"
                    fullWidth size="small"
                    inputProps={{ maxLength: 15 }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Sección 4: Prioridad y asignación */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                  4. Prioridad y asignación
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Opcional — puedes asignarlo ahora o hacerlo después desde Órdenes de trabajo
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Prioridad</InputLabel>
                      <Select value={prioridad} onChange={e => setPrioridad(e.target.value)} label="Prioridad">
                        <MenuItem value=""><em>Sin definir</em></MenuItem>
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
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Asignar a</InputLabel>
                      <Select
                        value={asignadoA}
                        onChange={e => handleAsignar(e.target.value)}
                        label="Asignar a"
                      >
                        <MenuItem value=""><em>Sin asignar</em></MenuItem>
                        {operadores.map(op => (
                          <MenuItem key={op.id} value={op.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: municipio.brandColor }}>
                                {(op.nombre || op.email || 'O')[0].toUpperCase()}
                              </Avatar>
                              {op.nombre ?? op.email}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* ── Columna derecha: resumen y acciones ──────── */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 80 }}>
            <Stack spacing={2}>

              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                    Vista previa
                  </Typography>

                  {categoria ? (
                    <VistaPreviaReporte
                      datos={{ categoria, subtipo, descripcion, ubicacion, lat, lon,
                        telefono, prioridad, fotoNombre: foto?.name, sector: sectorCalculado }}
                      municipio={municipio}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Selecciona una categoría para ver la vista previa
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                    Campos requeridos
                  </Typography>
                  <Stack spacing={1}>
                    {[
                      { label: 'Categoría',  ok: !!categoria  },
                      { label: 'Ubicación',  ok: !!ubicacion  },
                      { label: 'Descripción', ok: !!descripcion, optional: true },
                      { label: 'Foto',        ok: !!foto,        optional: true },
                    ].map(item => (
                      <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          bgcolor: item.ok ? '#D1FAE5' : item.optional ? '#F1F5F9' : '#FEE2E2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {item.ok
                            ? <CheckIcon sx={{ fontSize: 12, color: '#059669' }} />
                            : <Box sx={{ width: 6, height: 6, borderRadius: '50%',
                                bgcolor: item.optional ? '#94A3B8' : '#EF4444' }} />
                          }
                        </Box>
                        <Typography variant="caption" color={item.ok ? 'success.main' : 'text.secondary'}>
                          {item.label}
                          {item.optional && <span style={{ opacity: 0.6 }}> (opcional)</span>}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!puedeEnviar}
                onClick={handleSubmit}
                startIcon={enviando ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                sx={{
                  borderRadius: 2, py: 1.5,
                  bgcolor: municipio.brandColor,
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: municipio.brandColor, filter: 'brightness(1.1)' },
                  '&:disabled': { bgcolor: 'action.disabledBackground' },
                }}
              >
                {enviando ? 'Creando reporte...' : 'Crear reporte'}
              </Button>

              <Typography variant="caption" color="text.secondary" textAlign="center">
                Se generará un folio único automáticamente
              </Typography>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}