// src/pages/Dashboard.jsx
import React, { useState, useMemo } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Skeleton,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material'
import ReportIcon       from '@mui/icons-material/Assessment'
import CheckIcon        from '@mui/icons-material/CheckCircleOutline'
import PendingIcon      from '@mui/icons-material/HourglassEmpty'
import NewIcon          from '@mui/icons-material/FiberNew'
import ExpandMoreIcon   from '@mui/icons-material/ExpandMore'

import StatCard         from '@/components/ui/StatCard'
import FiltroTemporal   from '@/components/ui/FiltroTemporal'
import PieCategoria     from '@/components/charts/PieCategoria'
import BarTemporal      from '@/components/charts/BarTemporal'
import PieEstatus       from '@/components/charts/PieEstatus'
import ChartDeltaBacklog from '@/components/charts/ChartDeltaBacklog'
import PieSector        from '@/components/charts/PieSector' 
import BarSectorCategoria from '@/components/charts/BarSectorCategoria' 
import { useReportes }  from '@/hooks/useReportes'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { CATEGORIAS, getCategoriasPorArea } from '@/config/categorias'

export default function Dashboard() {
  const [filtro, setFiltro]     = useState('mes')
  const { municipio }           = useMunicipio()
  const { reportes, loading }   = useReportes(filtro)

  // 1. Cálculos generales y totales por Área
  const { total, porCategoria, porEstatus, porSector, porArea } = useMemo(() => {
    if (loading || !reportes.length) {
      return { total: 0, porCategoria: {}, porEstatus: {}, porSector: {}, porArea: {} }
    }
    const porCategoria = {}
    const porEstatus   = {}
    const porSector    = {}
    const porArea      = {} 

    // Mapa auxiliar para encontrar el área de una categoría rápidamente
    const areaMap = {}
    CATEGORIAS.forEach(c => { areaMap[c.firestoreValue] = c.area })

    reportes.forEach(r => {
      const cat = r.categoria || 'Otro'
      const est = r.estatus   || 'Nuevo'
      const sect = r.sector && r.sector !== "Sin asignar" ? r.sector : 'No clasificado'
      const area = areaMap[cat] || 'Sin clasificar'
      
      porCategoria[cat] = (porCategoria[cat] || 0) + 1
      porEstatus[est]   = (porEstatus[est]   || 0) + 1
      porSector[sect]   = (porSector[sect]   || 0) + 1
      porArea[area]     = (porArea[area]     || 0) + 1 
    })
    return { total: reportes.length, porCategoria, porEstatus, porSector, porArea }
  }, [reportes, loading])

  const nuevos      = porEstatus['Nuevo']      ?? 0
  const enProceso   = porEstatus['En proceso'] ?? 0
  const resueltos   = porEstatus['Resuelto']   ?? 0
  const pctResuelto = total > 0 ? Math.round((resueltos / total) * 100) : 0

  const diasFiltro = { dia: 1, semana: 7, mes: 30, anio: 365, todos: 30 }

  // 2. Cálculo de Estatus por Categoría
  const estatusPorCategoria = useMemo(() => {
    const resultado = {}

    CATEGORIAS.forEach(cat => {
      const filtrados = reportes.filter(r => r.categoria === cat.firestoreValue)
      const estatus = { Nuevo: 0, 'En proceso': 0, Resuelto: 0 }
      filtrados.forEach(r => {
        const e = r.estatus || 'Nuevo'
        estatus[e] = (estatus[e] || 0) + 1
      })
      resultado[cat.firestoreValue] = estatus
    })

    return resultado
  }, [reportes])

  // Obtenemos las categorías agrupadas
  const categoriasAgrupadas = getCategoriasPorArea()

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Panel de Información</Typography>
          <Typography variant="body2" color="text.secondary">
            {municipio.nombre}, {municipio.estado} · Información histórica de reportes
          </Typography>
        </Box>
        <FiltroTemporal value={filtro} onChange={setFiltro} />
      </Box>

      {/* Métricas resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total reportes',  value: total,      icon: <ReportIcon />,  color: municipio.brandColor, subtext: 'en el período seleccionado' },
          { label: 'Nuevos',          value: nuevos,     icon: <NewIcon />,     color: '#3B82F6', subtext: 'sin atender' },
          { label: 'En proceso',      value: enProceso,  icon: <PendingIcon />, color: '#F59E0B', subtext: 'en atención activa' },
          { label: '% Resueltos',     value: `${pctResuelto}%`, icon: <CheckIcon />, color: '#10B981', subtext: `${resueltos} de ${total} reportes` },
        ].map(card => (
          <Grid item xs={6} md={3} key={card.label}>
            <StatCard {...card} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Gráficas principales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={600} mb={0.5}>
                Reportes por tipo de incidencia
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distribución general de todos los reportes recibidos
              </Typography>
              <Box sx={{ mt: 2 }}>
                <PieCategoria porCategoria={porCategoria} loading={loading} height={280} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={600} mb={0.5}>
                Tendencia de nuevos reportes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cantidad de incidencias reportadas por día
              </Typography>
              <Box sx={{ mt: 2 }}>
                <BarTemporal reportes={reportes} dias={diasFiltro[filtro] ?? 30} loading={loading} height={240} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Inteligencia Geográfica: Sectores */}
      <Box sx={{ mb: 3, mt: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
                  Distribución Geográfica
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Concentración de reportes por Sector
                </Typography>
                <PieSector porSector={porSector} loading={loading} height={260} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
                  Incidencia por Sector y Categoría
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Identifica fácilmente qué tipo de problema afecta más a cada zona.
                </Typography>
                <BarSectorCategoria reportes={reportes} loading={loading} height={320} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Gráfico de Delta / Backlog */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={600} mb={0.5}>
            Balance de Gestión (Backlog)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Relación diaria de reportes entrantes (Nuevos) vs salientes (Resueltos). Un Delta por encima de cero significa que se resolvieron más reportes de los que se recibieron.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <ChartDeltaBacklog
              reportes={reportes}
              dias={diasFiltro[filtro] ?? 30}
              loading={loading}
              height={320}
            />
          </Box>
        </CardContent>
      </Card>

      {/* SECCIÓN COMBINADA: Gestión Operativa por Área (Desglose y Estatus) */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={600} mb={0.5}>
            Gestión Operativa por Área
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={3}>
            Desglose de incidencias y estatus actual agrupado por departamento.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Object.entries(categoriasAgrupadas).map(([area, cats]) => {
              const totalArea = porArea[area] || 0
              const pctArea = total > 0 ? (totalArea / total) * 100 : 0
              
              // No mostrar áreas sin reportes para no saturar la vista
              if(totalArea === 0 && !loading) return null;

              return (
                <Accordion 
                  key={area} 
                  disableGutters 
                  elevation={0} 
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    '&:before': { display: 'none' }, // Quita la línea separadora por defecto de MUI
                    overflow: 'hidden'
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ bgcolor: 'background.default' }}
                  >
                    {/* Cabecera del Departamento unificada */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                      <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                        {area}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                        {loading ? <Skeleton width={40} /> : totalArea} reportes ({pctArea.toFixed(1)}%)
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 3, pb: 3, px: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    
                    {/* PARTE 1: Lista de subcategorías */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Tipos de incidencia detectados
                      </Typography>
                      
                      {cats.map(cat => {
                        const count = porCategoria[cat.firestoreValue] ?? 0
                        
                        // Si la categoría no tiene reportes, no la listamos para ahorrar espacio
                        if (count === 0 && !loading) return null;
                        
                        const pct = totalArea > 0 ? (count / totalArea) * 100 : 0 // % relativo al área
                        
                        return (
                          <Box key={`list-${cat.id}`}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: 16 }}>{cat.emoji}</Typography>
                                <Typography variant="body2" fontWeight={500}>{cat.label}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">{pct.toFixed(1)}% del área</Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ minWidth: 28, textAlign: 'right' }}>
                                  {loading ? <Skeleton width={24} /> : count}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                              <Box sx={{
                                height: '100%', borderRadius: 3,
                                bgcolor: cat.color,
                                width: loading ? '0%' : `${pct}%`,
                                transition: 'width 0.6s ease',
                              }} />
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>

                    {/* PARTE 2: Gráficas de Estatus */}
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11, mb: 2 }}>
                      Estatus operativo
                    </Typography>
                    <Grid container spacing={2}>
                      {cats.map(cat => {
                        const data = estatusPorCategoria[cat.firestoreValue] || {}
                        const totalCat = (data['Nuevo'] || 0) + (data['En proceso'] || 0) + (data['Resuelto'] || 0)

                        // Si la categoría no tiene estatus activos, la ocultamos
                        if (totalCat === 0 && !loading) return null

                        return (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={`chart-${cat.id}`}>
                            <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.default' }}>
                              <CardContent sx={{ p: 2 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {cat.emoji} {cat.label}
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  <PieEstatus data={data} loading={loading} height={180} />
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        )
                      })}
                    </Grid>

                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}