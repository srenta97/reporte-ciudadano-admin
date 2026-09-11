// src/pages/Inteligencia.jsx
import React, { useState, useEffect, useMemo } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  alpha, useTheme, Stack, Tabs, Tab, FormControl, InputLabel, Select, MenuItem, Alert, Chip
} from '@mui/material'
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import FiltroTemporal from '@/components/ui/FiltroTemporal'
import { useReportes } from '@/hooks/useReportes'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { CATEGORIAS } from '@/config/categorias'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

// Íconos
import WarningIcon from '@mui/icons-material/WarningAmber'
import InsightsIcon from '@mui/icons-material/Insights'
import MapIcon from '@mui/icons-material/Map'
import TableChartIcon from '@mui/icons-material/TableChart'
import TimelineIcon from '@mui/icons-material/Timeline'

// Librerías para la proyección
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, ReferenceArea } from 'recharts'
import { startOfWeek, format, addWeeks, differenceInWeeks, min } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Función para determinar el color del polígono (Heatmap) ──
const getColorEscala = (valor, maximo) => {
  if (valor === 0 || maximo === 0) return '#3B82F6'; 
  const ratio = valor / maximo;
  if (ratio > 0.8) return '#800026';
  if (ratio > 0.6) return '#BD0026';
  if (ratio > 0.4) return '#E31A1C';
  if (ratio > 0.2) return '#FC4E2A';
  return '#FD8D3C';
}

// ── COMPONENTE NUEVO: Proyección Semanal Lineal ─────────────────
function ProyeccionSemanal({ reportes }) {
  const [categoria, setCategoria] = useState(CATEGORIAS[0]?.firestoreValue || '');

  const { dataGrafica, advertencia, tendenciaPct } = useMemo(() => {
    if (!reportes || reportes.length === 0) return { dataGrafica: [], advertencia: true, tendenciaPct: 0 };

    // 1. Filtrar reportes por la categoría seleccionada
    const filtrados = reportes.filter(r => r.categoria === categoria);
    if (filtrados.length === 0) return { dataGrafica: [], advertencia: true, tendenciaPct: 0 };

    // 2. Extraer fechas válidas
    const fechas = filtrados.map(r => {
      try {
        return r.fecha instanceof Date ? r.fecha : new Date(r.fecha_iso || r.fecha);
      } catch { return new Date(); }
    }).filter(d => !isNaN(d.getTime()));

    if (fechas.length === 0) return { dataGrafica: [], advertencia: true, tendenciaPct: 0 };

    // 3. Determinar el rango de semanas
    const minDate = startOfWeek(min(fechas), { weekStartsOn: 1 });
    const maxDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Hasta la semana actual
    const totalSemanas = differenceInWeeks(maxDate, minDate) + 1;
    
    // Regla de negocio: Menos de 8 semanas levanta un Warning
    const advertencia = totalSemanas < 8;

    // 4. Agrupar conteo por semanas (llenando con 0 las semanas vacías)
    const semanasMap = {};
    for (let i = 0; i < totalSemanas; i++) {
      const w = addWeeks(minDate, i);
      const key = format(w, 'yyyy-MM-dd');
      semanasMap[key] = { fecha: w, label: format(w, "d MMM", { locale: es }), real: 0 };
    }

    fechas.forEach(d => {
      const key = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (semanasMap[key]) semanasMap[key].real += 1;
    });

    const valoresY = Object.values(semanasMap).map(s => s.real);

    // 5. Matemáticas: Regresión Lineal Simple (Mínimos Cuadrados Ordinarios)
    const n = valoresY.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i; 
      sumY += valoresY[i];
      sumXY += i * valoresY[i]; 
      sumX2 += i * i;
    }
    const divisor = (n * sumX2 - sumX * sumX);
    const m = divisor === 0 ? 0 : (n * sumXY - sumX * sumY) / divisor; // Pendiente
    const b = (sumY - m * sumX) / n || 0; // Intersección

    // 6. Armar datos para la gráfica (Datos Históricos)
    const dataGrafica = Object.values(semanasMap).map((s, i) => ({
      name: s.label,
      real: s.real,
      proyectado: Math.max(0, m * i + b), // Max 0 para no tener reportes negativos
    }));

    // 7. Proyectar 4 semanas al futuro
    for (let i = 0; i < 4; i++) {
      const w = addWeeks(maxDate, i + 1);
      const idx = n + i;
      dataGrafica.push({
        name: format(w, "d MMM", { locale: es }),
        real: null, // No hay datos reales en el futuro
        proyectado: Math.max(0, m * idx + b),
      });
    }

    // 8. Calcular porcentaje de crecimiento semanal aproximado
    const avgY = sumY / n || 1;
    const tendenciaPct = (m / avgY) * 100;

    return { dataGrafica, advertencia, tendenciaPct };
  }, [reportes, categoria]);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220, bgcolor: 'background.paper' }}>
          <InputLabel>Categoría a proyectar</InputLabel>
          <Select value={categoria} onChange={e => setCategoria(e.target.value)} label="Categoría a proyectar">
            {CATEGORIAS.map(c => (
              <MenuItem key={c.id} value={c.firestoreValue}>{c.emoji} {c.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {tendenciaPct !== 0 && !advertencia && (
          <Chip 
            icon={<TimelineIcon />} 
            label={`Tendencia: ${tendenciaPct > 0 ? 'Aumentando' : 'Disminuyendo'} ${Math.abs(tendenciaPct).toFixed(1)}% semanal`}
            color={tendenciaPct > 0 ? 'error' : 'success'}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        )}
      </Box>

      {advertencia && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <strong>Datos insuficientes para una proyección precisa:</strong> El sistema detectó menos de 8 semanas de historial con los filtros actuales. Se recomienda cambiar el filtro superior a <strong>"Trimestre", "Este año" o "Todo el historial"</strong> para trazar una línea de tendencia realista.
        </Alert>
      )}

      <Box sx={{ height: 400, mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataGrafica} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} dy={10} />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip
               contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
               formatter={(value, name) => [value.toFixed(1), name === 'real' ? 'Reportes reales' : 'Tendencia proyectada']}
            />
            <RechartsLegend wrapperStyle={{ paddingTop: 20 }} />
            
            {/* Sombreado para identificar fácilmente la zona del "Futuro" */}
            {dataGrafica.length > 4 && (
              <ReferenceArea 
                x1={dataGrafica[dataGrafica.length - 5].name} 
                x2={dataGrafica[dataGrafica.length - 1].name} 
                fill="#F59E0B" 
                fillOpacity={0.08} 
              />
            )}

            <Line 
              type="monotone" 
              dataKey="real" 
              stroke="#3B82F6" 
              strokeWidth={3} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }} 
              name="Casos Reales (Histórico)" 
            />
            <Line 
              type="monotone" 
              dataKey="proyectado" 
              stroke="#F59E0B" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={false} 
              name="Proyección Matemática" 
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────
export default function Inteligencia() {
  const theme = useTheme()
  const { municipio } = useMunicipio()
  const [filtro, setFiltro] = useState('mes')
  const [zonas, setZonas] = useState([])
  const [loadingZonas, setLoadingZonas] = useState(true)
  
  // Estado para controlar qué pestaña está activa
  const [tabActual, setTabActual] = useState(0)

  const { reportes, loading: loadingReportes } = useReportes(filtro)

  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const qs = await getDocs(collection(db, 'zonas'))
        setZonas(qs.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error("Error cargando zonas", e)
      } finally {
        setLoadingZonas(false)
      }
    }
    fetchZonas()
  }, [])

  const { matriz, conteoZonas, maxReportesEnUnaZona, zonaMasAfectada } = useMemo(() => {
    if (!reportes.length) return { matriz: {}, conteoZonas: {}, maxReportesEnUnaZona: 0, zonaMasAfectada: null }

    const matrizTemp = {}
    const conteoTemp = {}

    zonas.forEach(z => {
      matrizTemp[z.nombre] = { total: 0 }
      CATEGORIAS.forEach(c => matrizTemp[z.nombre][c.firestoreValue] = 0)
      conteoTemp[z.nombre] = 0
    })

    matrizTemp['Sin asignar'] = { total: 0 }
    CATEGORIAS.forEach(c => matrizTemp['Sin asignar'][c.firestoreValue] = 0)
    conteoTemp['Sin asignar'] = 0

    reportes.forEach(r => {
      const s = r.sector && r.sector !== 'Sin asignar' ? r.sector : 'Sin asignar'
      const c = r.categoria || 'Otro'

      if (!matrizTemp[s]) {
        matrizTemp[s] = { total: 0 }
        CATEGORIAS.forEach(cat => matrizTemp[s][cat.firestoreValue] = 0)
      }

      if (matrizTemp[s][c] !== undefined) matrizTemp[s][c] += 1
      matrizTemp[s].total += 1
      conteoTemp[s] = (conteoTemp[s] || 0) + 1
    })

    let maximo = 0;
    let zonaPico = { nombre: 'N/A', total: 0 };
    
    Object.entries(conteoTemp).forEach(([nombreSector, total]) => {
      if (nombreSector !== 'Sin asignar') {
        if (total > maximo) {
          maximo = total;
          zonaPico = { nombre: nombreSector, total };
        }
      }
    })

    return { 
      matriz: matrizTemp, 
      conteoZonas: conteoTemp, 
      maxReportesEnUnaZona: maximo,
      zonaMasAfectada: maximo > 0 ? zonaPico : null
    }
  }, [reportes, zonas])

  const isLoading = loadingReportes || loadingZonas

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Inteligencia y Forecasting</Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis espacial, concentración y proyección de incidencias futuras.
          </Typography>
        </Box>
        <FiltroTemporal value={filtro} onChange={setFiltro} />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Métricas Rápidas */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: alpha('#EF4444', 0.05), borderColor: alpha('#EF4444', 0.2) }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningIcon sx={{ color: '#EF4444' }} />
                    <Typography variant="subtitle2" fontWeight={700} color="#EF4444">
                      Foco Rojo (Zona más afectada)
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={800}>
                    {zonaMasAfectada?.nombre || 'Ninguna'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {zonaMasAfectada?.total || 0} reportes en este período
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(municipio.brandColor, 0.1), color: municipio.brandColor }}>
                      <InsightsIcon />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>Interpretación Automática</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Utiliza el Mapa para entender la densidad geográfica. Cambia a la Matriz para cruzar 
                        los Sectores con las Categorías, o utiliza la herramienta de Proyección para anticipar
                        la carga de trabajo de las próximas 4 semanas basada en el comportamiento histórico.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Selector de Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabActual} 
              onChange={(e, val) => setTabActual(val)} 
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab 
                icon={<MapIcon fontSize="small"/>} 
                iconPosition="start" 
                label="Mapa Coroplético" 
                sx={{ textTransform: 'none', fontWeight: 600 }} 
              />
              <Tab 
                icon={<TableChartIcon fontSize="small"/>} 
                iconPosition="start" 
                label="Matriz de Datos" 
                sx={{ textTransform: 'none', fontWeight: 600 }} 
              />
              <Tab 
                icon={<TimelineIcon fontSize="small"/>} 
                iconPosition="start" 
                label="Proyección de Tendencias" 
                sx={{ textTransform: 'none', fontWeight: 600 }} 
              />
            </Tabs>
          </Box>

          {/* CONTENIDO DE PESTAÑAS */}
          
          {/* Pestaña 0: Mapa */}
          {tabActual === 0 && (
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Mapa de Densidad por Sector</Typography>
                
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">Densidad:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {['#3B82F6', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'].map(color => (
                      <Box key={color} sx={{ width: 16, height: 16, bgcolor: color, borderRadius: '4px' }} />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary">Alta</Typography>
                </Stack>
              </Box>
              
              <Box sx={{ height: 500, position: 'relative' }}>
                <MapContainer
                  center={municipio.mapCenter}
                  zoom={municipio.mapZoom}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_3gio_1_24b05530968dfd66167515fb"
                  />

                  {zonas.map(zona => {
                    let geojsonObj = null;
                    try {
                      geojsonObj = typeof zona.geojson === 'string' ? JSON.parse(zona.geojson) : zona.geojson;
                    } catch (e) { return null }

                    if (!geojsonObj || !geojsonObj.coordinates) return null;

                    const polygonPositions = geojsonObj.coordinates[0].map(coord => [coord[1], coord[0]])
                    const reportesEnZona = conteoZonas[zona.nombre] || 0
                    const colorSector = getColorEscala(reportesEnZona, maxReportesEnUnaZona)

                    return (
                      <Polygon 
                        key={zona.id} 
                        positions={polygonPositions} 
                        pathOptions={{
                          fillColor: colorSector,
                          fillOpacity: reportesEnZona > 0 ? 0.6 : 0.1, 
                          color: reportesEnZona > 0 ? colorSector : municipio.brandColor,
                          weight: 2
                        }}
                      >
                        <Popup>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="subtitle2" fontWeight={800}>{zona.nombre}</Typography>
                            <Typography variant="body2">{reportesEnZona} reportes totales</Typography>
                          </Box>
                        </Popup>
                      </Polygon>
                    )
                  })}
                </MapContainer>
              </Box>
            </Card>
          )}

          {/* Pestaña 1: Matriz */}
          {tabActual === 1 && (
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" fontWeight={700}>Matriz de Incidencia (Sector vs Categoría)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Las celdas en rojo indican una concentración inusualmente alta de un problema específico en una sola zona.
                </Typography>
              </Box>
              
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, bgcolor: 'action.hover' }}>Sector Operativo</TableCell>
                      {CATEGORIAS.map(cat => (
                        <TableCell key={cat.id} align="center" sx={{ fontWeight: 700, bgcolor: 'action.hover', lineHeight: 1.1 }}>
                          <Typography variant="caption" display="block">{cat.emoji}</Typography>
                          <Typography variant="caption">{cat.label}</Typography>
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ fontWeight: 800, bgcolor: 'action.hover' }}>Total Zona</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(matriz).sort().map(nombreSector => {
                      const datosSector = matriz[nombreSector];
                      
                      return (
                        <TableRow key={nombreSector} hover>
                          <TableCell sx={{ fontWeight: 600, color: nombreSector === 'Sin asignar' ? 'text.secondary' : 'text.primary' }}>
                            {nombreSector}
                          </TableCell>
                          
                          {CATEGORIAS.map(cat => {
                            const valor = datosSector[cat.firestoreValue] || 0;
                            const esFocoRojoCelda = valor >= 5; 
                            
                            return (
                              <TableCell 
                                key={cat.id} 
                                align="center"
                                sx={{ 
                                  bgcolor: esFocoRojoCelda ? alpha('#EF4444', 0.15) : 'transparent',
                                  color: esFocoRojoCelda ? '#B91C1C' : (valor > 0 ? 'text.primary' : 'text.disabled'),
                                  fontWeight: valor > 0 ? 700 : 400
                                }}
                              >
                                {valor === 0 ? '—' : valor}
                              </TableCell>
                            )
                          })}
                          
                          <TableCell align="center" sx={{ fontWeight: 800, bgcolor: alpha(municipio.brandColor, 0.05) }}>
                            {datosSector.total}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* Pestaña 2: Proyecciones Matemáticas */}
          {tabActual === 2 && (
             <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" fontWeight={700}>Proyección a 4 Semanas (Regresión Lineal)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Modelo estadístico que estima la carga de incidencias futuras basándose en el comportamiento histórico de la categoría.
                </Typography>
              </Box>
              <CardContent>
                <ProyeccionSemanal reportes={reportes} />
              </CardContent>
             </Card>
          )}

        </>
      )}
    </Box>
  )
}