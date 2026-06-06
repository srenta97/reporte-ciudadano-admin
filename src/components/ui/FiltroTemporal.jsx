// src/components/ui/FiltroTemporal.jsx
import React from 'react'
import { ToggleButtonGroup, ToggleButton } from '@mui/material'
import { FILTROS_TIEMPO } from '@/hooks/useReportes'
import { useMunicipio }   from '@/contexts/MunicipioContext'

export default function FiltroTemporal({ value, onChange }) {
  const { municipio } = useMunicipio()
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8rem',
          px: 2, py: 0.75,
          border: '1px solid',
          borderColor: 'divider',
          color: 'text.secondary',
          '&.Mui-selected': {
            bgcolor: municipio.brandColor,
            color: 'white',
            borderColor: municipio.brandColor,
            '&:hover': { bgcolor: municipio.brandColor, filter: 'brightness(1.1)' },
          },
        },
      }}
    >
      {Object.entries(FILTROS_TIEMPO).map(([key, { label }]) => (
        <ToggleButton key={key} value={key}>{label}</ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
