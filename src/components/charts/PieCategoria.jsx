// src/components/charts/PieCategoria.jsx
import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Box, Typography, Skeleton, useTheme } from '@mui/material'
import { CATEGORIAS, CATEGORIA_MAP } from '@/config/categorias'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function PieCategoria({ porCategoria = {}, loading = false, height = 260 }) {
  const theme = useTheme()

  const { labels, values, colors } = useMemo(() => {
    // Ordenar según el orden oficial de CATEGORIAS y filtrar los que tengan datos
    const ordenados = CATEGORIAS
      .map(cat => ({
        label: cat.label,
        value: porCategoria[cat.firestoreValue] ?? 0,
        color: cat.color,
      }))
      .filter(c => c.value > 0)

    return {
      labels: ordenados.map(c => c.label),
      values: ordenados.map(c => c.value),
      colors: ordenados.map(c => c.color),
    }
  }, [porCategoria])

  const total = values.reduce((a, b) => a + b, 0)

  if (loading) return <Skeleton variant="circular" width={height} height={height} sx={{ mx: 'auto' }} />
  if (total === 0) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
      <Typography color="text.secondary" variant="body2">Sin datos para este período</Typography>
    </Box>
  )

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: theme.palette.background.paper,
      borderWidth: 3,
      hoverOffset: 6,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 14,
          font: { size: 12, family: '"Plus Jakarta Sans", sans-serif' },
          color: theme.palette.text.secondary,
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            const pct = ((ctx.parsed / total) * 100).toFixed(1)
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <Box sx={{ position: 'relative', height }}>
      {/* Total en el centro del donut */}
      <Box sx={{
        position: 'absolute',
        top: '38%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <Typography variant="h4" fontWeight={700}>{total}</Typography>
        <Typography variant="caption" color="text.secondary">reportes</Typography>
      </Box>
      <Doughnut data={data} options={options} />
    </Box>
  )
}
