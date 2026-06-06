import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Box, Typography, Skeleton, useTheme } from '@mui/material'

ChartJS.register(ArcElement, Tooltip, Legend)

const ESTATUS = [
  { key: 'Nuevo', label: 'Nuevo', color: '#3B82F6' },
  { key: 'En proceso', label: 'En proceso', color: '#F59E0B' },
  { key: 'Resuelto', label: 'Resuelto', color: '#10B981' },
]

export default function PieEstatus({ data = {}, loading = false, height = 260 }) {
  const theme = useTheme()

  const { labels, values, colors } = useMemo(() => {
    const ordenados = ESTATUS
      .map(est => ({
        label: est.label,
        value: data[est.key] ?? 0,
        color: est.color,
      }))
      .filter(e => e.value > 0)

    return {
      labels: ordenados.map(e => e.label),
      values: ordenados.map(e => e.value),
      colors: ordenados.map(e => e.color),
    }
  }, [data])

  const total = values.reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <Skeleton
        variant="circular"
        width={height}
        height={height}
        sx={{ mx: 'auto' }}
      />
    )
  }

  if (total === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          Sin datos para este período
        </Typography>
      </Box>
    )
  }

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: theme.palette.background.paper,
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
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
          font: {
            size: 12,
            family: '"Plus Jakarta Sans", sans-serif',
          },
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
      {/* Total en el centro */}
      <Box
        sx={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          {total}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          reportes
        </Typography>
      </Box>

      <Doughnut data={chartData} options={options} />
    </Box>
  )
}