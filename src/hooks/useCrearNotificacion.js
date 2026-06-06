// src/hooks/useCrearNotificacion.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase'; 
import { useAuth } from '@/contexts/AuthContext';

export function useCrearNotificacion() {
  const { user, perfil } = useAuth();

  /**
   * Crea una nueva notificación en Firestore
   * @param {Object} params
   * @param {string} params.usuario_destino_id - ID del usuario que recibe la notificación
   * @param {string} params.titulo - Título corto (ej. "Nueva asignación")
   * @param {string} params.descripcion - Detalle de la notificación
   * @param {string} [params.tipo] - 'info', 'success', 'warning', 'error'
   * @param {string} [params.enlace] - URL a la que debería llevar la notificación
   * @param {string} [params.reporte_id] - ID del reporte/ticket para abrir el modal
   */
  const crearNotificacion = async ({ 
    usuario_destino_id, 
    titulo, 
    descripcion, 
    tipo = 'info',
    enlace = null,
    reporte_id = null // 1. ¡Añadido aquí a los parámetros!
  }) => {
    try {
      if (!usuario_destino_id) return;

      // if (usuario_destino_id === user.uid) return;

      await addDoc(collection(db, 'notificaciones'), {
        usuario_id: usuario_destino_id, 
        creado_por: user?.uid || 'sistema', 
        creado_por_nombre: perfil?.nombre || user?.email || 'Sistema',
        titulo,
        descripcion,
        tipo,
        enlace,
        leida: false,
        fecha_creacion: serverTimestamp(),
        reporte_id // 2. ¡Guardado con el mismo nombre que el parámetro!
      });
      
    } catch (error) {
      console.error('Error al crear notificación:', error);
    }
  };

  return { crearNotificacion };
}