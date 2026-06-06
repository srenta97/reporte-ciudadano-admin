// src/config/municipios.js
// ─────────────────────────────────────────────────────────────
// Configuración por municipio. Para agregar uno nuevo, añade
// una entrada al objeto MUNICIPIOS con el slug como clave.
// El slug activo se lee de localStorage o de la URL al login.
// ─────────────────────────────────────────────────────────────

export const MUNICIPIOS = {
  juchitlan: {
    slug:       'juchitlan',
    nombre:     'Juchitlán',
    estado:     'Jalisco',
    pais:       'México',
    // Colección raíz en Firestore. Todos los docs de este municipio
    // viven bajo este prefijo, permitiendo una sola base de datos.
    coleccionReportes:    'reportes',
    coleccionConversaciones: 'conversaciones',
    // Centro del mapa (lat, lon) y zoom inicial
    mapCenter:  [20.083, -104.097],
    mapZoom:    14.5,
    // Colores de marca del municipio (usados en sidebar y header)
    brandColor: '#002b5d',
    brandLight: '#E3F2FD',
    // Logo (ruta relativa a /public)
    logo: '/logos/juchitlan.png',
    // WhatsApp sandbox/número de producción (solo informativo en el panel)
    whatsappNum: '+14155238886',
  },

  // ── Ejemplo de segundo municipio ──────────────────────────
  // zapopan: {
  //   slug:       'zapopan',
  //   nombre:     'Zapopan',
  //   estado:     'Jalisco',
  //   coleccionReportes: 'reportes_zapopan',
  //   mapCenter:  [20.7214, -103.3904],
  //   mapZoom:    13,
  //   brandColor: '#2E7D32',
  //   brandLight: '#E8F5E9',
  //   logo: '/logos/zapopan.png',
  //   whatsappNum: '+52...',
  // },
}

// Municipio por defecto si no hay uno en localStorage
export const MUNICIPIO_DEFAULT = 'juchitlan'

// Obtiene la config del municipio activo
export function getMunicipio(slug) {
  return MUNICIPIOS[slug] ?? MUNICIPIOS[MUNICIPIO_DEFAULT]
}
