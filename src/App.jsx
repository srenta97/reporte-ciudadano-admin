// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }      from '@/contexts/AuthContext'
import { MunicipioProvider } from '@/contexts/MunicipioContext'
import ProtectedRoute        from '@/components/ui/ProtectedRoute'
import MainLayout            from '@/layouts/MainLayout'
import Login                 from '@/pages/Login'
import Dashboard             from '@/pages/Dashboard'
import Mapa                  from '@/pages/Mapa'
import Gestion               from '@/pages/Gestion'
import Usuarios              from '@/pages/Usuarios'
import Reportes              from '@/pages/Reportes'
import OrdenesTrabajo        from '@/pages/OrdenesTrabajo'
import NuevoReporte          from '@/pages/NuevoReporte'
import ForgotPassword        from '@/pages/ForgotPassword'

export default function App() {
  return (
    <BrowserRouter>
      <MunicipioProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-password" element={<ForgotPassword />} />

            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index          element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="mapa"      element={<Mapa />} />
              <Route path="usuarios"  element={
                <ProtectedRoute requireAdmin>
                  <Usuarios />
                </ProtectedRoute>
              } />
              <Route path="gestion"   element={
                <ProtectedRoute requireOperador>
                  <Gestion />
                </ProtectedRoute>
              } />
              <Route path="reportes" element={<Reportes />} />
              <Route path="ordenes" element={
                <ProtectedRoute requireOperador>
                  <OrdenesTrabajo />
                </ProtectedRoute>
              } />
              <Route path="nuevo-reporte" element={
                <ProtectedRoute requireOperador>
                  <NuevoReporte />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MunicipioProvider>
    </BrowserRouter>
  )
}
