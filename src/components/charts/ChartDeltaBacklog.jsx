// src/components/charts/ChartDeltaBacklog.jsx
import React, { useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ChartDeltaBacklog({ reportes, dias = 30, loading, height = 300 }) {
  const data = useMemo(() => {
    if (!reportes || reportes.length === 0) return []

    const today = startOfDay(new Date())
    const daysMap = {}
    const result = []

    // 1. Crear el esqueleto de los últimos X días
    for (let i = dias - 1; i >= 0; i--) {
      const d = subDays(today, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayObj = {
        fechaStr: dateStr,
        fecha: format(d, 'd MMM', { locale: es }),
        Abiertos: 0,
        Resueltos: 0,
        Delta: 0
      }
      daysMap[dateStr] = dayObj
      result.push(dayObj)
    }

    // Helper para extraer fecha en formato 'yyyy-MM-dd' de forma segura
    const getSafeDateStr = (val) => {
      if (!val) return null
      try {
        if (typeof val === 'string') return val.substring(0, 10) // Extrae YYYY-MM-DD
        const d = val.toDate ? val.toDate() : new Date(val)
        if (isNaN(d.getTime())) return null
        return format(d, 'yyyy-MM-dd')
      } catch {
        return null
      }
    }

    // 2. Procesar reportes
    reportes.forEach(r => {
      // Contar como Abierto en su fecha de creación
      const openDate = getSafeDateStr(r.fecha || r.fecha_iso)
      if (openDate && daysMap[openDate]) {
        daysMap[openDate].Abiertos += 1
      }

      // Contar como Resuelto en su fecha de resolución
      if (r.estatus === 'Resuelto' && r.fecha_resolucion) {
        const closeDate = getSafeDateStr(r.fecha_resolucion)
        if (closeDate && daysMap[closeDate]) {
          daysMap[closeDate].Resueltos += 1
        }
      }
    })

    // 3. Calcular Delta (Resueltos - Abiertos)
    // Si resuelven más de los que abren, el Delta es positivo (ganan al backlog)
    result.forEach(d => {
      d.Delta = d.Resueltos - d.Abiertos
    })

    return result
  }, [reportes, dias])

  if (loading) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
        Calculando balance de gestión...
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
        
        {/* Línea de Cero para ubicar visualmente si el delta es positivo o negativo */}
        <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1.5} />

        <Bar dataKey="Abiertos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} name="Nuevos (Entrantes)" />
        <Bar dataKey="Resueltos" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} name="Resueltos (Salientes)" />
        <Line type="monotone" dataKey="Delta" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Delta (Balance)" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}