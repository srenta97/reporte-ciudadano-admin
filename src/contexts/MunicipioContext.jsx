// src/contexts/MunicipioContext.jsx
import React, { createContext, useContext, useMemo, useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { getMunicipio, MUNICIPIO_DEFAULT } from '@/config/municipios'
import { createMunicipioTheme } from '@/theme'

const MunicipioContext = createContext(null)

export function MunicipioProvider({ children }) {
  const [slug, setSlug] = useState(
    () => localStorage.getItem('municipio') ?? MUNICIPIO_DEFAULT
  )

  const municipio = useMemo(() => getMunicipio(slug), [slug])
  const theme     = useMemo(() => createMunicipioTheme(municipio.brandColor), [municipio])

  const cambiarMunicipio = (nuevoSlug) => {
    localStorage.setItem('municipio', nuevoSlug)
    setSlug(nuevoSlug)
  }

  return (
    <MunicipioContext.Provider value={{ municipio, slug, cambiarMunicipio }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </MunicipioContext.Provider>
  )
}

export const useMunicipio = () => useContext(MunicipioContext)
