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
    color:   '#F59E0B',   // amber
    chipBg:  '#FEF3C7',
    chipTxt: '#92400E',
    firestoreValue: 'Lámparas',
  },
  {
    id:      'agua_potable',
    label:   'Agua Potable',
    emoji:   '🚰',
    color:   '#06B6D4',   // cyan
    chipBg:  '#CFFAFE',
    chipTxt: '#155E75',
    firestoreValue: 'Agua Potable',
  },
  {
    id:      'drenaje',
    label:   'Drenaje y Aguas Negras',
    emoji:   '🚱',
    color:   '#14B8A6',   // teal
    chipBg:  '#CCFBF1',
    chipTxt: '#115E59',
    firestoreValue: 'Drenaje y Aguas Negras',
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

// ── Subtipos integrados ──────────────────────────────────────
export const SUBTIPOS = {
  'Lámparas': [
    'No enciende', 'Parpadea', 'Encendida todo el día', 'Poste dañado', 'Falta luminaria', 'Otro'
  ],
  'Agua Potable': [
    'Fuga de agua en calle', 'Fuga de agua en banqueta', 'Falta de suministro', 'Baja presión de agua', 'Otro'
  ],
  'Drenaje y Aguas Negras': [
    'Fuga de aguas negras', 'Drenaje colapsado / tapado', 'Alcantarilla sin tapa', 'Alcantarilla hundida', 'Malos olores', 'Otro'
  ],
  'Basura': [
    'Basura acumulada en vía pública', 'Contenedor desbordado', 'Quema de basura', 'Falta de recolección en ruta', 'Otro'
  ],
  'Baches': [
    'Bache profundo', 'Grieta en pavimento', 'Hundimiento o socavón', 'Falta de balizamiento / pintura', 'Otro'
  ],
  'Ruido excesivo': [
    'Música a alto volumen (Vecinos)', 'Ruido de negocio / bar / taller', 'Construcción fuera de horario', 'Mascotas ruidosas', 'Otro'
  ],
  'Retiro de objetos en vía pública': [
    'Escombros o materiales de construcción', 'Muebles o cacharros abandonados', 'Apartalugares (cubetas, llantas, etc.)', 'Puesto ambulante obstruyendo', 'Otro'
  ],
  'Inspección a negocios/comercios': [
    'Operando fuera de horario permitido', 'Invasión de banqueta con mercancía', 'Falta de medidas de seguridad / higiene', 'Venta de alcohol sin permiso (clandestino)', 'Otro'
  ],
  'Animales': [
    'Perro / gato agresivo o suelto', 'Animal muerto en vía pública', 'Maltrato animal', 'Animal de granja en zona urbana', 'Otro'
  ],
  'Autos mal estacionados': [
    'Obstruyendo cochera', 'Estacionado sobre la banqueta', 'Estacionado en lugar para discapacitados', 'Estacionado en doble fila', 'Vehículo abandonado (chatarra)', 'Otro'
  ],
  'Arbolado': [
    'Árbol caído', 'Ramas peligrosas tocando cables', 'Árbol seco / en riesgo de caer', 'Raíces dañando banqueta / tubería', 'Poda excesiva no autorizada', 'Otro'
  ],
  'Otro': [
    'Vandalismo / Grafiti', 'Falla en semáforo', 'Daño a mobiliario urbano (bancas, parques)', 'Otro problema'
  ],
}

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