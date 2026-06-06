// src/components/ui/StatCard.jsx
import React from 'react'
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material'
import TrendingUpIcon   from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

export default function StatCard({
  label, value, subtext, icon, color = '#1565C0', trend, loading = false,
}) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} height={44} />
            ) : (
              <Typography variant="h3" fontWeight={700} sx={{ mt: 0.5, color: 'text.primary', lineHeight: 1 }}>
                {value}
              </Typography>
            )}
            {subtext && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                {trend === 'up'   && <TrendingUpIcon   sx={{ fontSize: 14, color: 'success.main' }} />}
                {trend === 'down' && <TrendingDownIcon sx={{ fontSize: 14, color: 'error.main'   }} />}
                <Typography variant="caption" color="text.secondary">{subtext}</Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box sx={{
              width: 48, height: 48, borderRadius: 2.5,
              bgcolor: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Box sx={{ color, '& svg': { fontSize: 24 } }}>{icon}</Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
