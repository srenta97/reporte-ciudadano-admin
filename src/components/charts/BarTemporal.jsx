// src/components/charts/BarTemporal.jsx
import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js'
import { Box, Skeleton, Typography, useTheme } from '@mui/material'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { useMunicipio } from '@/contexts/MunicipioContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function BarTemporal({ reportes = [], dias = 7, loading = false, height = 220 }) {
  const theme     = useTheme()
  const { municipio } = useMunicipio()

  const { labels, values } = useMemo(() => {
    const hoy   = new Date()
    const rango = eachDayOfInterval({ start: subDays(hoy, dias - 1), end: hoy })

    const conteo = {}
    reportes.forEach(r => {
      if (!r.fecha) return
      const key = format(r.fecha, 'yyyy-MM-dd')
      conteo[key] = (conteo[key] ?? 0) + 1
    })

    return {
      labels: rango.map(d => format(d, dias <= 7 ? 'EEE dd' : 'dd/MM', { locale: es })),
      values: rango.map(d => conteo[format(d, 'yyyy-MM-dd')] ?? 0),
    }
  }, [reportes, dias])

  if (loading) return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
  if (values.every(v => v === 0)) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
      <Typography color="text.secondary" variant="body2">Sin datos para este período</Typography>
    </Box>
  )

  const data = {
    labels,
    datasets: [{
      label: 'Reportes',
      data: values,
      backgroundColor: `${municipio.brandColor}CC`,
      borderRadius: 6,
      borderSkipped: false,
      hoverBackgroundColor: municipio.brandColor,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.parsed.y} reportes` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, family: '"Plus Jakarta Sans", sans-serif' },
          color: theme.palette.text.secondary,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: { size: 11 },
          color: theme.palette.text.secondary,
        },
        grid: { color: theme.palette.divider },
      },
    },
  }

  return (
    <Box sx={{ height }}>
      <Bar data={data} options={options} />
    </Box>
  )
}
