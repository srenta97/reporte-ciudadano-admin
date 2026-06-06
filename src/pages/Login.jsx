// src/pages/Login.jsx
import React, { useState } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress, Link
} from '@mui/material'
import EmailIcon        from '@mui/icons-material/EmailOutlined'
import LockIcon         from '@mui/icons-material/LockOutlined'
import VisibilityIcon   from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import BusinessIcon     from '@mui/icons-material/Business'
import { useAuth }      from '@/contexts/AuthContext'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { useNavigate, Link as RouterLink }  from 'react-router-dom'

export default function Login() {
  const { login }     = useAuth()
  const { municipio } = useMunicipio()
  const navigate      = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential'
          ? 'Correo o contraseña incorrectos.'
          : 'Error al iniciar sesión. Intenta de nuevo.'
      )
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
      {/* Fondo decorativo */}
      <Box sx={{
        position: 'absolute', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        bgcolor: `${municipio.brandColor}12`,
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', bottom: -80, left: -80,
        width: 300, height: 300, borderRadius: '50%',
        bgcolor: `${municipio.brandColor}08`,
        pointerEvents: 'none',
      }} />

      <Box sx={{ width: '100%', maxWidth: 420, px: 2, position: 'relative', zIndex: 1 }}>
        {/* Header con logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 60, height: 60, borderRadius: 3,
            bgcolor: municipio.brandColor,
            display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', mb: 2,
            boxShadow: `0 8px 24px ${municipio.brandColor}40`,
          }}>
            <BusinessIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Bienvenido
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Panel Administrativo · {municipio.nombre}, {municipio.estado}
          </Typography>
        </Box>

        <Card sx={{ boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} mb={0.5}>
              Iniciar sesión
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Ingresa tus credenciales de acceso
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Contraseña"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(v => !v)} edge="end" size="small">
                        {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                <Link
                  component={RouterLink}
                  to="/recuperar-password"
                  variant="body2"
                  underline="hover"
                  sx={{ 
                    color: municipio.brandColor,
                    fontWeight: 500
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>

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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
          Reporte Ciudadano v1.0 · {municipio.nombre}
        </Typography>
      </Box>
    </Box>
  )
}
