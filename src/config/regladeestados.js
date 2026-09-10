// src/config/regladeestados.js

/**
 * MÁQUINA DE ESTADOS:
 * Define hacia qué estados se puede mover un ticket dependiendo de su estado actual.
 * Los estados vacíos [] son estados terminales (no se puede cambiar el estatus después).
 */
export const TRANSICIONES_ESTADO = {
  'Nuevo': ['En proceso', 'No aplica', 'Rechazado'],
  'En proceso': ['Resuelto', 'No aplica'],
  'Resuelto': [],  // Estado terminal
  'No aplica': [], // Estado terminal
  'Rechazado': []  // Estado terminal
};

/**
 * RESPUESTAS RÁPIDAS:
 * Opciones de texto predefinidas que se muestran al usuario dependiendo 
 * del estado al que quiere mover el reporte.
 * Siempre debe incluir "Otra" al final para permitir texto libre.
 */
export const RESPUESTAS_RAPIDAS = {
  'En proceso': [
    'Cuadrilla en camino para inspección',
    'Material solicitado a almacén',
    'Programado en la ruta de hoy',
    'Otra'
  ],
  'Resuelto': [
    'Reparación concluida exitosamente',
    'Servicio restablecido por completo',
    'Limpieza y recolección terminada',
    'Otra'
  ],
  'Rechazado': [
    'Reporte duplicado',
    'Falsa alarma / No se encontró el problema',
    'Información insuficiente',
    'Otra'
  ],
  'No aplica': [
    'Problema dentro de propiedad privada',
    'Corresponde a jurisdicción Estatal/Federal',
    'Otra'
  ]
};