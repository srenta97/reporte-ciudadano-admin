// src/pages/ForgotPassword.jsx
import React, { useState } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, Alert, CircularProgress, Link
} from '@mui/material'
import EmailIcon from '@mui/icons-material/EmailOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined'
import { useAuth } from '@/contexts/AuthContext'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { Link as RouterLink } from 'react-router-dom'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const { municipio } = useMunicipio()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await resetPassword(email)
      setMessage('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.')
      setEmail('')
    } catch (err) {
      // Manejo de errores común de Firebase
      if (err.code === 'auth/user-not-found') {
        setError('No existe ninguna cuenta registrada con este correo electrónico.')
      } else {
        setError('Hubo un error al intentar enviar el correo. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fondos decorativos para mantener consistencia con el Login */}
      <Box sx={{
        position: 'absolute', top: -100, right: -100, width: 400, height: 400,
        borderRadius: '50%', bgcolor: `${municipio.brandColor}12`, pointerEvents: 'none',
      }} />

      <Box sx={{ width: '100%', maxWidth: 420, px: 2, position: 'relative', zIndex: 1 }}>
        <Card sx={{ boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} mb={0.5}>
              ¿Olvidaste tu contraseña?
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Ingresa tu correo institucional y te enviaremos un enlace seguro para restablecerla.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{message}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                fullWidth
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 1, py: 1.5,
                  bgcolor: municipio.brandColor,
                  fontSize: '1rem',
                  '&:hover': { bgcolor: municipio.brandColor, filter: 'brightness(1.1)' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar enlace'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Link
                  component={RouterLink}
                  to="/login"
                  variant="body2"
                  underline="hover"
                  sx={{ 
                    color: 'text.secondary',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 500
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 18 }} /> Volver al inicio de sesión
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}