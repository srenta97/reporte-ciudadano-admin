// src/config/categorias.js
// ─────────────────────────────────────────────────────────────
// Fuente única de verdad para categorías, orden, colores e iconos.
// El orden aquí es el orden oficial definido por el municipio.
// ─────────────────────────────────────────────────────────────

export const CATEGORIAS = [
  {
    id:      'lamparas',
    label:   'Lámparas',
    emoji:   '💡',
    // Color del marcador en el mapa
    color:   '#F59E0B',   // amber
    // Color del chip/badge en tablas
    chipBg:  '#FEF3C7',
    chipTxt: '#92400E',
    // Coincide exactamente con el valor guardado en Firestore por el bot
    firestoreValue: 'Lámparas',
  },
  {
    id:      'basura',
    label:   'Basura',
    emoji:   '🗑️',
    color:   '#EF4444',   // red
    chipBg:  '#FEE2E2',
    chipTxt: '#991B1B',
    firestoreValue: 'Basura',
  },
  {
    id:      'baches',
    label:   'Baches',
    emoji:   '🕳️',
    color:   '#6B7280',   // gray
    chipBg:  '#F3F4F6',
    chipTxt: '#374151',
    firestoreValue: 'Baches',
  },
  {
    id:      'ruido',
    label:   'Ruido excesivo',
    emoji:   '🔊',
    color:   '#8B5CF6',   // violet
    chipBg:  '#EDE9FE',
    chipTxt: '#5B21B6',
    firestoreValue: 'Ruido excesivo',
  },
  {
    id:      'objetos',
    label:   'Objetos en vía',
    emoji:   '🧱',
    color:   '#F97316',   // orange
    chipBg:  '#FFEDD5',
    chipTxt: '#9A3412',
    firestoreValue: 'Retiro de objetos en vía pública',
  },
  {
    id:      'negocios',
    label:   'Negocios',
    emoji:   '🕵️',
    color:   '#0EA5E9',   // sky
    chipBg:  '#E0F2FE',
    chipTxt: '#0C4A6E',
    firestoreValue: 'Inspección a negocios/comercios',
  },
  {
    id:      'animales',
    label:   'Animales',
    emoji:   '🐾',
    color:   '#10B981',   // emerald
    chipBg:  '#D1FAE5',
    chipTxt: '#065F46',
    firestoreValue: 'Animales',
  },
  {
    id:      'autos',
    label:   'Autos',
    emoji:   '🚗',
    color:   '#3B82F6',   // blue
    chipBg:  '#DBEAFE',
    chipTxt: '#1E3A8A',
    firestoreValue: 'Autos mal estacionados',
  },
  {
    id:      'arbolado',
    label:   'Arbolado',
    emoji:   '🌳',
    color:   '#22C55E',   // green
    chipBg:  '#DCFCE7',
    chipTxt: '#14532D',
    firestoreValue: 'Arbolado',
  },
  {
    id:      'otro',
    label:   'Otro',
    emoji:   '⚙️',
    color:   '#94A3B8',   // slate
    chipBg:  '#F1F5F9',
    chipTxt: '#334155',
    firestoreValue: 'Otro',
  },
]

// Lookup rápido por firestoreValue → categoría
export const CATEGORIA_MAP = Object.fromEntries(
  CATEGORIAS.map(c => [c.firestoreValue, c])
)

// Colores para Chart.js (mismo orden que CATEGORIAS)
export const CHART_COLORS       = CATEGORIAS.map(c => c.color)
export const CHART_COLORS_LIGHT = CATEGORIAS.map(c => c.chipBg)
export const CHART_LABELS       = CATEGORIAS.map(c => c.label)

// Estatus del ciclo de vida de un reporte
export const ESTATUS = [
  { value: 'Nuevo',       label: 'Nuevo',         color: '#3B82F6', bg: '#DBEAFE' },
  { value: 'En proceso',  label: 'En proceso',    color: '#F59E0B', bg: '#FEF3C7' },
  { value: 'Resuelto',    label: 'Resuelto',      color: '#10B981', bg: '#D1FAE5' },
  { value: 'No aplica',   label: 'No aplica',     color: '#6B7280', bg: '#F3F4F6' },
  { value: 'Rechazado',   label: 'Rechazado',     color: '#EF4444', bg: '#FEE2E2' },
]

export const ESTATUS_MAP = Object.fromEntries(ESTATUS.map(e => [e.value, e]))
