// src/theme/index.js
import { createTheme } from '@mui/material/styles'

// Crea el tema MUI a partir del color de marca del municipio activo.
// Se llama desde MunicipioContext cada vez que cambia el municipio.
export function createMunicipioTheme(brandColor = '#1565C0') {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main:  brandColor,
        light: `${brandColor}22`,
        dark:  brandColor,
        contrastText: '#fff',
      },
      secondary: {
        main: '#673AB7',
        contrastText: '#fff',
      },
      background: {
        default: '#F8FAFC',
        paper:   '#FFFFFF',
      },
      text: {
        primary:   '#1E293B',
        secondary: '#64748B',
      },
      divider: '#E2E8F0',
      success: { main: '#10B981' },
      warning: { main: '#F59E0B' },
      error:   { main: '#EF4444' },
      info:    { main: '#0EA5E9' },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      h1: { fontWeight: 700, fontSize: '2rem'   },
      h2: { fontWeight: 700, fontSize: '1.5rem' },
      h3: { fontWeight: 600, fontSize: '1.25rem' },
      h4: { fontWeight: 600, fontSize: '1.125rem' },
      h5: { fontWeight: 600, fontSize: '1rem' },
      h6: { fontWeight: 600, fontSize: '0.875rem' },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500, color: '#64748B' },
      body2: { color: '#64748B' },
      caption: { color: '#94A3B8' },
    },
    shape: { borderRadius: 12 },
    shadows: [
      'none',
      '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
      '0px 4px 6px rgba(0,0,0,0.05), 0px 2px 4px rgba(0,0,0,0.04)',
      '0px 10px 15px rgba(0,0,0,0.07), 0px 4px 6px rgba(0,0,0,0.04)',
      '0px 20px 25px rgba(0,0,0,0.08), 0px 8px 10px rgba(0,0,0,0.04)',
      ...Array(20).fill('0px 25px 50px rgba(0,0,0,0.10)'),
    ],
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #F1F5F9',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          },
          contained: {
            boxShadow: '0px 2px 6px rgba(0,0,0,0.15)',
            '&:hover': { boxShadow: '0px 4px 12px rgba(0,0,0,0.20)' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748B',
            backgroundColor: '#F8FAFC',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: '0.75rem' },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.06)',
          },
        },
      },
    },
  })
}
