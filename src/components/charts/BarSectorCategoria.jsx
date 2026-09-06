// src/components/charts/BarSectorCategoria.jsx
import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Skeleton, Box, Typography } from '@mui/material';
import { CATEGORIAS } from '@/config/categorias';

export default function BarSectorCategoria({ reportes, loading, height = 350 }) {
  if (loading) {
    return <Skeleton variant="rounded" width="100%" height={height} sx={{ borderRadius: 3 }} />;
  }

  // Preparamos los datos cruzando Sector vs Categoría
  const data = useMemo(() => {
    const sectoresMap = {};

    reportes.forEach(r => {
      const sector = r.sector && r.sector !== "Sin asignar" ? r.sector : 'No clasificado';
      const cat = r.categoria || 'Otro';

      if (!sectoresMap[sector]) {
        sectoresMap[sector] = { name: sector };
      }
      
      sectoresMap[sector][cat] = (sectoresMap[sector][cat] || 0) + 1;
    });

    return Object.values(sectoresMap);
  }, [reportes]);

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">No hay datos suficientes.</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 15 }} />
        
        {CATEGORIAS.map((cat, index) => {
          // Checamos si esta categoría existe en al menos un sector para no renderizar barras vacías
          const categoriaTieneDatos = data.some(d => d[cat.firestoreValue] > 0);
          if (!categoriaTieneDatos) return null;

          return (
            <Bar 
              key={cat.id} 
              dataKey={cat.firestoreValue} 
              stackId="a" 
              fill={cat.color || '#ccc'} 
              name={cat.label} 
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}