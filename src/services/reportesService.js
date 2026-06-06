// src/services/reportesService.js
// ─────────────────────────────────────────────────────────────
// Lógica de negocio para crear reportes manualmente desde el panel.
// Genera el mismo esquema de documento que escribe el bot de n8n,
// para que sea 100% compatible con dashboard, mapa y exportaciones.
// ─────────────────────────────────────────────────────────────
import {
  collection, addDoc, Timestamp,
} from 'firebase/firestore'
import {
  ref, uploadBytes, getDownloadURL,
} from 'firebase/storage'
import { db, storage } from '@/config/firebase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Generar folio único estilo RCJ-XXXXX ──────────────────────
function generarFolio() {
  const num = String(Math.floor(10000 + Math.random() * 90000))
  return `RCJ-${num}`
}

// ── Subir foto a Firebase Storage ─────────────────────────────
// Devuelve la URL pública o '' si no hay archivo.
export async function subirFoto(archivo, folio, coleccion) {
  if (!archivo) return ''
  try {
    const ext      = archivo.name.split('.').pop()
    const path     = `${coleccion}/${folio}_${Date.now()}.${ext}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, archivo)
    return await getDownloadURL(storageRef)
  } catch (err) {
    console.error('Error subiendo foto:', err)
    return ''
  }
}

// ── Crear reporte manualmente ─────────────────────────────────
// Recibe todos los datos del formulario y escribe en Firestore
// con el mismo esquema que usa el bot de n8n.
export async function crearReporteManual({
  coleccion,        // municipio.coleccionReportes
  categoria,        // string — firestoreValue de CATEGORIAS
  subtipo,          // string — solo para Lámparas
  descripcion,      // string — descripción adicional del problema
  ubicacion,        // string — dirección en texto
  lat,              // string — latitud (vacío si no se seleccionó en mapa)
  lon,              // string — longitud
  fotoUrl,          // string — URL de Firebase Storage (ya subida)
  tieneFoto,        // boolean
  telefono,         // string — teléfono del ciudadano (opcional)
  prioridad,        // 'alta' | 'media' | 'baja' | ''
  asignadoA,        // uid del operador (vacío si no asignado)
  asignadoNombre,   // nombre del operador
  autorNombre,      // nombre del funcionario que crea el reporte
  estatus,          // 'Nuevo' por defecto
}) {
  const folio = generarFolio()
  const ahora = new Date()

  const meses = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ]

  // Entrada inicial de actividad
  const entradaCreacion = {
    texto:       `Reporte creado manualmente por ${autorNombre}`,
    autorNombre: autorNombre ?? 'Sistema',
    tipo:        'creacion',
    fecha:       Timestamp.fromDate(ahora),
  }

  const doc = {
    // ── Campos del bot (compatibilidad total) ──────────────
    folio,
    telefono:          telefono ?? '',
    telefono_wa:       '',            // vacío — no viene de WhatsApp
    categoria,
    subtipo:           subtipo ?? '',
    ubicacion:         ubicacion ?? '',
    lat:               lat ?? '',
    lon:               lon ?? '',
    foto_url:          fotoUrl ?? '',
    tiene_foto:        tieneFoto ? 'si' : 'no',
    estatus:           estatus ?? 'Nuevo',
    fecha_iso:         Timestamp.fromDate(ahora),
    fecha_legible:     `${ahora.getDate()} de ${meses[ahora.getMonth()]} de ${ahora.getFullYear()}`,
    hora:              format(ahora, 'HH:mm'),
    anio:              String(ahora.getFullYear()),
    mes:               String(ahora.getMonth() + 1).padStart(2, '0'),
    dia:               String(ahora.getDate()).padStart(2, '0'),
    atendido_por:      '',
    notas_internas:    descripcion ?? '',
    fecha_resolucion:  '',
    // ── Campos de órdenes de trabajo ──────────────────────
    prioridad:         prioridad ?? '',
    asignado_a:        asignadoA ?? '',
    asignado_nombre:   asignadoNombre ?? '',
    actividad:         [entradaCreacion],
    // ── Metadatos del origen ──────────────────────────────
    origen:            'manual',      // 'whatsapp' | 'manual'
    fecha_actualizacion: Timestamp.fromDate(ahora),
  }

  const ref = await addDoc(collection(db, coleccion), doc)
  return { id: ref.id, folio }
}
