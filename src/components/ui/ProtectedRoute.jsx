// src/components/ui/ProtectedRoute.jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children, requireOperador = false, requireAdmin = false }) {
  const { user, loading, esOperador, esAdmin } = useAuth()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requireAdmin    && !esAdmin)    return <Navigate to="/dashboard" replace />
  if (requireOperador && !esOperador) return <Navigate to="/dashboard" replace />

  return children
}
