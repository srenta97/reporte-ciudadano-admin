import React, { useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Stack, Alert, CircularProgress, Divider, Container
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '@/contexts/AuthContext'
import { useMunicipio } from '@/contexts/MunicipioContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useNavigate } from 'react-router-dom'

export default function EditarPerfil() {
  const { perfil, user } = useAuth()
  const { municipio } = useMunicipio()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: perfil?.nombre || '',
    apellidos: perfil?.apellidos || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setLoading(true)
    setError('')
    try {
      const userRef = doc(db, 'usuarios', user.uid)
      await updateDoc(userRef, {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        ultimaEdicion: new Date()
      })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      console.error(err)
      setError('No pudimos guardar los cambios. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ pt: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate(-1)}
        sx={{ mb: 2, borderRadius: 2 }}
      >
        Volver
      </Button>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        Editar mi perfil
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Actualiza tu información personal visible en el sistema.
      </Typography>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ borderRadius: 2 }}>Cambios guardados correctamente</Alert>}

              <TextField
                label="Nombre"
                fullWidth
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />

              <TextField
                label="Apellidos"
                fullWidth
                value={formData.apellidos}
                onChange={e => setFormData({...formData, apellidos: e.target.value})}
              />

              {/* Campo no editable visualmente para contexto */}
              <TextField
                label="Correo electrónico"
                disabled
                fullWidth
                value={user?.email || ''}
              />

              <Divider sx={{ my: 1 }} />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                sx={{ 
                  borderRadius: 2, py: 1.5, bgcolor: municipio.brandColor,
                  '&:hover': { bgcolor: municipio.brandColor, filter: 'brightness(1.1)' }
                }}
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  )
}