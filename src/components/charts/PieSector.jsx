// src/components/charts/PieSector.jsx
import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Skeleton, Box, Typography } from '@mui/material';

// Paleta de colores predefinida para sectores
const COLORES_SECTORES = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'
];

export default function PieSector({ porSector, loading, height = 250 }) {
  if (loading) {
    return <Skeleton variant="rounded" width="100%" height={height} sx={{ borderRadius: 3 }} />;
  }

  // Transformar el objeto { 'Sector Norte': 10, 'Sector Sur': 5 } en array para Recharts
  const data = Object.keys(porSector).map((sectorName) => ({
    name: sectorName || 'Sin sector',
    value: porSector[sectorName]
  })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay datos de sectores en este periodo.
        </Typography>
      </Box>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 2, boxShadow: 3, border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" fontWeight={600}>{payload[0].name}</Typography>
          <Typography variant="caption" color="text.secondary">
            Total reportes: {payload[0].value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={height * 0.25}
          outerRadius={height * 0.4}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORES_SECTORES[index % COLORES_SECTORES.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
      </PieChart>
    </ResponsiveContainer>
  );
}