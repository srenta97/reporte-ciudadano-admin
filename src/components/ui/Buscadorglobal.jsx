// src/components/ui/BuscadorGlobal.jsx
// ─────────────────────────────────────────────────────────────
// Buscador global por folio (RCJ-XXXXX) o teléfono.
// Abre un Dialog desde el ícono de lupa en el AppBar.
// Los resultados abren directamente TicketDetalle.jsx.
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog, DialogContent, TextField, Box, Typography,
  InputAdornment, IconButton, Divider, CircularProgress,
  Chip, Tooltip, Skeleton, Fade,
} from '@mui/material'
import SearchIcon      from '@mui/icons-material/Search'
import CloseIcon       from '@mui/icons-material/Close'
import FolioIcon       from '@mui/icons-material/ConfirmationNumber'
import PhoneIcon       from '@mui/icons-material/PhoneOutlined'
import LocationIcon    from '@mui/icons-material/LocationOnOutlined'
import ArrowIcon       from '@mui/icons-material/ChevronRight'
import {
  collection, query, where, orderBy, limit,
  getDocs,
} from 'firebase/firestore'
import { db }              from '@/config/firebase'
import { useMunicipio }    from '@/contexts/MunicipioContext'
import { useOrdenesTrabajo } from '@/hooks/useOrdenesTrabajo'
import { CATEGORIA_MAP, ESTATUS_MAP } from '@/config/categorias'
import { PRIORIDAD_MAP }   from '@/hooks/useOrdenesTrabajo'
import TicketDetalle       from '@/components/tickets/TicketDetalle'
import { format }          from 'date-fns'
import { es }              from 'date-fns/locale'

// ── Helpers ───────────────────────────────────────────────────
function safeDate(r) {
  try {
    const d = r.fecha instanceof Date ? r.fecha
      : r.fecha_iso?.toDate ? r.fecha_iso.toDate()
      : new Date(r.fecha_iso)
    return format(d, "d MMM yyyy", { locale: es })
  } catch { return r.fecha_legible ?? '—' }
}

// ── Chip de estatus compacto ──────────────────────────────────
function MiniChip({ value, map, fallbackLabel }) {
  const item = map?.[value]
  if (!item) return (
    <Chip label={fallbackLabel ?? value ?? '—'} size="small"
      sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />
  )
  return (
    <Chip label={value ?? fallbackLabel} size="small"
      sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: item.bg, color: item.color }} />
  )
}

// ── Tarjeta de resultado ──────────────────────────────────────
function ResultadoCard({ reporte, onClick, brandColor }) {
  const cat   = CATEGORIA_MAP[reporte.categoria]
  const esOrigen = reporte.origen === 'manual'

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2, py: 1.5, cursor: 'pointer',
        borderLeft: '3px solid',
        borderLeftColor: cat?.color ?? brandColor,
        transition: 'background 0.12s',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* Emoji de categoría */}
      <Box sx={{
        width: 36, height: 36, borderRadius: 2, flexShrink: 0,
        bgcolor: cat ? `${cat.color}15` : 'action.hover',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {cat?.emoji ?? '📋'}
      </Box>

      {/* Info principal */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', fontWeight: 700, color: brandColor, fontSize: 11 }}
          >
            {reporte.folio ?? '—'}
          </Typography>
          {esOrigen && (
            <Chip label="Manual" size="small"
              sx={{ height: 14, fontSize: 9, fontWeight: 600,
                bgcolor: 'action.selected', color: 'text.secondary' }} />
          )}
          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <MiniChip value={reporte.estatus ?? 'Nuevo'} map={ESTATUS_MAP} />
          </Box>
        </Box>

        <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
          {cat ? `${cat.label}` : reporte.categoria ?? '—'}
          {reporte.subtipo ? ` · ${reporte.subtipo}` : ''}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
          {reporte.ubicacion && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, minWidth: 0 }}>
              <LocationIcon sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {reporte.ubicacion}
              </Typography>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 'auto' }}>
            {safeDate(reporte)}
          </Typography>
        </Box>
      </Box>

      <ArrowIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
    </Box>
  )
}

// ── Skeletons de carga ────────────────────────────────────────
function ResultadosSkeleton() {
  return (
    <Box sx={{ px: 2, py: 1 }}>
      {[1, 2, 3].map(i => (
        <Box key={i} sx={{ display: 'flex', gap: 1.5, py: 1.5 }}>
          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 2, flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="30%" height={14} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="60%" height={16} sx={{ mb: 0.25 }} />
            <Skeleton variant="text" width="80%" height={12} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

// ── Hook de búsqueda ──────────────────────────────────────────
function useBusqueda(termino, coleccion) {
  const [resultados, setResultados] = useState([])
  const [buscando,   setBuscando]   = useState(false)
  const [buscado,    setBuscado]    = useState(false) // true cuando completó al menos una búsqueda

  useEffect(() => {
    // Limpiar si el término está vacío
    if (!termino.trim() || termino.length < 2) {
      setResultados([])
      setBuscando(false)
      setBuscado(false)
      return
    }

    setBuscando(true)
    setBuscado(false)

    // Debounce de 350ms para no disparar en cada tecla
    const timer = setTimeout(async () => {
      try {
        const col  = collection(db, coleccion)
        const term = termino.trim()
        const termUpper = term.toUpperCase()

        // ── Query 1: búsqueda por folio (prefix match) ────────
        // Los folios son "RCJ-XXXXX". Buscamos tanto si escribe
        // "RCJ-002" como si escribe solo "002".
        const qFolio = query(
          col,
          where('folio', '>=', termUpper),
          where('folio', '<=', termUpper + '\uf8ff'),
          limit(5)
        )

        // ── Query 2: búsqueda por teléfono (prefix match) ─────
        const soloDigitos = term.replace(/\D/g, '')
        const qTelefono = soloDigitos.length >= 3
          ? query(
              col,
              where('telefono', '>=', soloDigitos),
              where('telefono', '<=', soloDigitos + '\uf8ff'),
              limit(5)
            )
          : null

        // Ejecutar en paralelo
        const [snapFolio, snapTelefono] = await Promise.all([
          getDocs(qFolio),
          qTelefono ? getDocs(qTelefono) : Promise.resolve({ docs: [] }),
        ])

        // Combinar y deduplicar por id
        const seen = new Set()
        const docs = []

        const procesar = (snap) => {
          snap.docs.forEach(d => {
            if (!seen.has(d.id)) {
              seen.add(d.id)
              const data = d.data()
              const fecha = data.fecha_iso?.toDate?.() ?? new Date(data.fecha_iso)
              docs.push({ id: d.id, ...data, fecha })
            }
          })
        }

        procesar(snapFolio)
        procesar(snapTelefono)

        // Ordenar por fecha descendente
        docs.sort((a, b) => (b.fecha ?? 0) - (a.fecha ?? 0))

        setResultados(docs)
      } catch (err) {
        console.error('Error en búsqueda global:', err)
        setResultados([])
      } finally {
        setBuscando(false)
        setBuscado(true)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [termino, coleccion])

  return { resultados, buscando, buscado }
}

// ── Componente principal ──────────────────────────────────────
export default function BuscadorGlobal() {
  const { municipio }     = useMunicipio()
  const [abierto,  setAbierto]  = useState(false)
  const [termino,  setTermino]  = useState('')
  const [reporteActivo, setReporteActivo] = useState(null)
  const inputRef = useRef(null)

  const { resultados, buscando, buscado } = useBusqueda(
    termino,
    municipio.coleccionReportes
  )

  // Operaciones para TicketDetalle
  const { agregarNota, cambiarEstatus, cambiarPrioridad, asignarReporte, reportes } =
    useOrdenesTrabajo('todos')

  // Sincronizar reporte activo cuando cambien los datos en tiempo real
  useEffect(() => {
    if (reporteActivo) {
      const actualizado = reportes.find(r => r.id === reporteActivo.id)
      if (actualizado) setReporteActivo(actualizado)
    }
  }, [reportes])

  const abrir = () => {
    setAbierto(true)
    setTermino('')
    // Focus al input con pequeño delay para la animación del Dialog
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const cerrar = () => {
    setAbierto(false)
    setTermino('')
  }

  const abrirDetalle = (reporte) => {
    setReporteActivo(reporte)
    cerrar()
  }

  // Atajo de teclado Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        abierto ? cerrar() : abrir()
      }
      if (e.key === 'Escape' && abierto) cerrar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [abierto])

  const sinResultados = buscado && !buscando && resultados.length === 0 && termino.length >= 2
  const conResultados = buscado && !buscando && resultados.length > 0

  return (
    <>
      {/* ── Barra buscadora visual (Trigger) ──────────────────── */}
      <Box
        onClick={abrir}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1,
          width: '100%',
          maxWidth: 500, // Evita que crezca infinitamente en pantallas muy grandes
          bgcolor: 'action.hover', // Un gris claro y sutil
          borderRadius: 2,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'background 0.2s',
          '&:hover': { bgcolor: 'action.selected' },
        }}
      >
        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            flex: 1, 
            textAlign: 'left',
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            userSelect: 'none'
          }}
        >
          Buscar por folio (RCJ-00241) o teléfono...
        </Typography>

        {/* Atajo de teclado visual (Se oculta en celulares para ahorrar espacio) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            fontSize: 10,
            fontWeight: 700,
            color: 'text.secondary',
            fontFamily: 'monospace'
          }}
        >
          ⌘K
        </Box>
      </Box>

      {/* ── Dialog de búsqueda ──────────────────────────── */}
      <Dialog
        open={abierto}
        onClose={cerrar}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={150}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            // Posicionar en la parte superior de la pantalla
            position: 'fixed',
            top: { xs: 16, md: 80 },
            m: { xs: 1, md: 0 },
          },
        }}
        BackdropProps={{
          sx: { backdropFilter: 'blur(2px)' },
        }}
      >
        {/* Input de búsqueda */}
        <Box sx={{
          display: 'flex', alignItems: 'center',
          px: 2, py: 1.5, gap: 1,
        }}>
          {buscando
            ? <CircularProgress size={20} sx={{ color: municipio.brandColor, flexShrink: 0 }} />
            : <SearchIcon sx={{ fontSize: 22, color: 'text.secondary', flexShrink: 0 }} />
          }
          <TextField
            inputRef={inputRef}
            value={termino}
            onChange={e => setTermino(e.target.value)}
            placeholder="Buscar por folio (RCJ-00241) o teléfono..."
            fullWidth
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{
              '& input': {
                fontSize: '1rem',
                py: 0.5,
                '&::placeholder': { color: 'text.disabled' },
              },
            }}
            autoComplete="off"
          />
          {termino && (
            <IconButton size="small" onClick={() => setTermino('')} sx={{ flexShrink: 0 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Contenido — estados */}
        {(termino.length >= 2) && (
          <>
            <Divider />
            <DialogContent sx={{ p: 0, maxHeight: 420, overflow: 'auto' }}>

              {/* Cargando */}
              {buscando && <ResultadosSkeleton />}

              {/* Sin resultados */}
              {sinResultados && (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 36, mb: 1 }}>🔍</Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Sin resultados para "{termino}"
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Intenta con el folio completo (RCJ-XXXXX) o los 10 dígitos del teléfono
                  </Typography>
                </Box>
              )}

              {/* Resultados */}
              {conResultados && (
                <Box>
                  {/* Header de resultados */}
                  <Box sx={{
                    px: 2, py: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {termino.toUpperCase().includes('RCJ') && (
                        <Chip icon={<FolioIcon style={{ fontSize: 11 }} />}
                          label="folio" size="small"
                          sx={{ height: 18, fontSize: 9, bgcolor: `${municipio.brandColor}15`,
                            color: municipio.brandColor }} />
                      )}
                      {/^\d+$/.test(termino.replace(/\s/g, '')) && (
                        <Chip icon={<PhoneIcon style={{ fontSize: 11 }} />}
                          label="teléfono" size="small"
                          sx={{ height: 18, fontSize: 9, bgcolor: '#EDE9FE', color: '#7C3AED' }} />
                      )}
                    </Box>
                  </Box>
                  <Divider />

                  {/* Lista de resultados */}
                  {resultados.map((r, i) => (
                    <React.Fragment key={r.id}>
                      <ResultadoCard
                        reporte={r}
                        onClick={() => abrirDetalle(r)}
                        brandColor={municipio.brandColor}
                      />
                      {i < resultados.length - 1 && <Divider sx={{ mx: 2 }} />}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </DialogContent>
          </>
        )}

        {/* Footer con hint cuando está vacío */}
        {!termino && (
          <Box sx={{
            px: 2.5, py: 1.5,
            display: 'flex', gap: 2, alignItems: 'center',
            bgcolor: 'action.hover',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <FolioIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">Folio: RCJ-00241</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">Teléfono: 3312345678</Typography>
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto', fontFamily: 'monospace' }}>
              Esc para cerrar
            </Typography>
          </Box>
        )}
      </Dialog>

      {/* ── TicketDetalle — se abre al hacer clic en resultado ── */}
      <TicketDetalle
        reporte={reporteActivo}
        open={!!reporteActivo}
        onClose={() => setReporteActivo(null)}
        onAgregarNota={agregarNota}
        onCambiarEstatus={cambiarEstatus}
        onCambiarPrioridad={cambiarPrioridad}
        onAsignar={asignarReporte}
      />
    </>
  )
}