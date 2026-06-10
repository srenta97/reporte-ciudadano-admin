// src/hooks/useNotifications.js

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/config/firebase'; // Asegúrate de que esta ruta apunte a tu instancia de db
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function useNotifications() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setNotificaciones([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notificaciones'),
      where('usuario_id', '==', user.uid),
      orderBy('fecha_creacion', 'desc')
    );

    // Bandera para saber si es la primera vez que carga la página
    let cargaInicial = true; 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notasArr = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let fechaFormateada = 'Reciente';
        if (data.fecha_creacion) {
          try {
            fechaFormateada = formatDistanceToNow(data.fecha_creacion.toDate(), { addSuffix: true, locale: es });
          } catch (e) { console.error('Error formateando fecha', e); }
        }
        return { id: docSnap.id, ...data, fechaFormateada };
      });

      setNotificaciones(notasArr);
      setLoading(false);
      setError(null);

      // ── LÓGICA DEL SONIDO ──
      // Si NO es la carga inicial, revisamos si hay documentos "añadidos"
      if (!cargaInicial) {
        const hayNuevas = snapshot.docChanges().some(change => change.type === 'added');
        
        if (hayNuevas) {
          // 1. Reproducir sonido (ya desbloqueado)
          const audio = new Audio('/sounds/notificacion.mp3');
          audio.volume = 1; // Volumen normal
          audio.play().catch(e => console.warn('Audio bloqueado', e));
          
          // 2. Mostrar popup nativo del sistema (si dio permiso)
          if ('Notification' in window && Notification.permission === 'granted') {
            // Obtenemos el último documento añadido para mostrar su título
            const ultimaNotif = snapshot.docChanges().find(c => c.type === 'added').doc.data();
            
            new Notification(ultimaNotif.titulo || 'Nueva Notificación', {
              body: ultimaNotif.descripcion || 'Tienes actualizaciones en el sistema.',
              icon: '/vite.svg' // Cambia esto por la ruta del logo de tu municipio/app
            });
          }
        }
      }
      
      cargaInicial = false; // Después de la primera ejecución, lo cambiamos a false
      
    }, (err) => {
      console.error('Error escuchando notificaciones:', err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ── Funciones de Acción ─────────────────────────────────────

  // 1. Marcar una sola notificación como leída
  const marcarComoLeida = async (id) => {
    try {
      const ref = doc(db, 'notificaciones', id);
      await updateDoc(ref, { leida: true });
    } catch (err) {
      console.error('Error al marcar notificación como leída', err);
    }
  };

  // 2. Marcar TODAS como leídas usando un Batch (ideal para rendimiento)
  const marcarTodasComoLeidas = async () => {
    const noLeidas = notificaciones.filter(n => !n.leida);
    if (noLeidas.length === 0) return;

    try {
      const batch = writeBatch(db);
      noLeidas.forEach(notif => {
        const ref = doc(db, 'notificaciones', notif.id);
        batch.update(ref, { leida: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error al marcar todas como leídas', err);
    }
  };

  // ── Datos Derivados ─────────────────────────────────────────
  const noLeidasCount = notificaciones.filter(n => !n.leida).length;

  return {
    notificaciones,
    noLeidasCount,
    loading,
    error,
    marcarComoLeida,
    marcarTodasComoLeidas
  };
}