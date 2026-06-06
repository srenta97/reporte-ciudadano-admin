// src/pages/Dashboard.jsx
import React, { useState, useMemo } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Divider, Skeleton,
} from '@mui/material'
import ReportIcon       from '@mui/icons-material/Assessment'
import CheckIcon        from '@mui/icons-material/CheckCircleOutline'
import PendingIcon      from '@mui/icons-material/HourglassEmpty'
import NewIcon          from '@mui/icons-material/FiberNew'
import StatCard         from '@/components/ui/StatCard'
import FiltroTemporal   from '@/components/ui/FiltroTemporal'
import PieCategoria     from '@/components/charts/PieCategoria'
import BarTemporal      from '@/components/charts/BarTemporal'
import PieEstatus       from '@/components/charts/PieEstatus'
import ChartDeltaBacklog from '@/components/charts/ChartDeltaBacklog' // <-- IMPORTACIÓN NUEVA
import { useReportes }  from '@/hooks/useReportes'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { CATEGORIAS }   from '@/config/categorias'


export default function Dashboard() {
  const [filtro, setFiltro]     = useState('mes')
  const { municipio }           = useMunicipio()
  const { reportes, loading, stats } = useReportes(filtro)

  const { total, porCategoria, porEstatus } = useMemo(() => {
    if (loading || !reportes.length) {
      return { total: 0, porCategoria: {}, porEstatus: {} }
    }
    const porCategoria = {}
    const porEstatus   = {}
    reportes.forEach(r => {
      const cat = r.categoria || 'Otro'
      const est = r.estatus   || 'Nuevo'
      porCategoria[cat] = (porCategoria[cat] || 0) + 1
      porEstatus[est]   = (porEstatus[est]   || 0) + 1
    })
    return { total: reportes.length, porCategoria, porEstatus }
  }, [reportes, loading])

  const nuevos      = porEstatus['Nuevo']      ?? 0
  const enProceso   = porEstatus['En proceso'] ?? 0
  const resueltos   = porEstatus['Resuelto']   ?? 0
  const pctResuelto = total > 0 ? Math.round((resueltos / total) * 100) : 0

  const diasFiltro = { dia: 1, semana: 7, mes: 30, anio: 365, todos: 30 }

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

      {/* Gráficas principales originales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={600} mb={0.5}>
                Reportes por categoría
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distribución según orden de prioridad oficial
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

      {/* NUEVA SECCIÓN: Gráfico de Delta / Backlog */}
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

      {/* Resto del Dashboard: Tabla de categorías y Estatus por categoría */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Desglose por categoría
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {CATEGORIAS.map(cat => {
              const count = porCategoria[cat.firestoreValue] ?? 0
              const pct   = total > 0 ? (count / total) * 100 : 0
              return (
                <Box key={cat.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 16 }}>{cat.emoji}</Typography>
                      <Typography variant="body2" fontWeight={500}>{cat.label}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">{pct.toFixed(1)}%</Typography>
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
        </CardContent>
      </Card>

      {/* Gráficas de Estatus por Categoría */}
      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={600} mb={0.5}>
            Estatus por categoría
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Distribución de estatus dentro de cada tipo de reporte
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {CATEGORIAS.map(cat => {
              const data = estatusPorCategoria[cat.firestoreValue] || {}
              const totalCat = (data['Nuevo'] || 0) + (data['En proceso'] || 0) + (data['Resuelto'] || 0)

              if (totalCat === 0) return null

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
                  <Card variant="outlined">
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
        </CardContent>
      </Card>
    </Box>
  )
}