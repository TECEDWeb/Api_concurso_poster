const db = require('../config/db');
const LogsService = require('./logsService');

exports.getAdminStats = async () => {
  try {
    // 1. Contar usuarios
    const [usuarios] = await db.query(
      'SELECT COUNT(*) AS total FROM usuarios'
    );

    // 2. Contar concursos
    const [concursos] = await db.query(
      'SELECT COUNT(*) AS total FROM concursos'
    );

    // 3. Contar proyectos
    const [proyectos] = await db.query(
      'SELECT COUNT(*) AS total FROM proyectos'
    );

    // 4. Contar evaluaciones
    const [evaluaciones] = await db.query(
      'SELECT COUNT(*) AS total FROM evaluaciones'
    );

    // 5. Contar evaluaciones completadas (estado = 'evaluado')
    const [completadas] = await db.query(
      "SELECT COUNT(*) AS total FROM evaluaciones WHERE estado = 'evaluado'"
    );

    // 6. Calcular promedio usando la vista vista_resumen_evaluaciones
    let promedio = 0;
    try {
      const [promedioResult] = await db.query(
        'SELECT AVG(puntaje_total) AS promedio FROM vista_resumen_evaluaciones'
      );
      promedio = promedioResult[0].promedio || 0;
    } catch (e) {
      // Si la vista no existe, calcular directamente
      try {
        const [promedioResult] = await db.query(`
          SELECT AVG(total_puntaje) AS promedio FROM (
            SELECT SUM(n.puntaje) AS total_puntaje
            FROM evaluaciones e
            JOIN detalles_evaluacion d ON e.id = d.evaluacion_id
            JOIN niveles n ON d.nivel_id = n.id
            GROUP BY e.id
          ) AS puntajes
        `);
        promedio = promedioResult[0].promedio || 0;
      } catch (e2) {
        console.log('No se pudo calcular el promedio:', e2.message);
        promedio = 0;
      }
    }

    // Redondear promedio a 1 decimal
    promedio = Math.round(promedio * 10) / 10;

    console.log('DATOS DASHBOARD:', {
      usuarios: usuarios[0].total,
      concursos: concursos[0].total,
      proyectos: proyectos[0].total,
      evaluaciones: evaluaciones[0].total,
      completadas: completadas[0].total,
      promedio: promedio
    });

    return {
      usuarios: usuarios[0].total || 0,
      concursos: concursos[0].total || 0,
      proyectos: proyectos[0].total || 0,
      evaluaciones: evaluaciones[0].total || 0,
      completadas: completadas[0].total || 0,
      promedio: promedio || 0
    };

  } catch (error) {
    console.error('ERROR DASHBOARD SERVICE:', error);
    throw error;
  }
};

/**
 * Obtener actividades recientes desde la tabla logs_actividad
 */
exports.getActividadesRecientes = async (limite = 5) => {
  try {
    // Usar la tabla logs_actividad
    const [logs] = await db.query(`
      SELECT 
        id,
        usuario_nombre,
        usuario_rol,
        tipo,
        accion,
        entidad_nombre,
        descripcion,
        created_at as fecha
      FROM logs_actividad
      ORDER BY created_at DESC
      LIMIT ?
    `, [limite]);

    // Formatear para el frontend
    return logs.map(log => {
      const icon = getIconForTipo(log.tipo);
      const color = getColorForTipo(log.tipo);
      
      return {
        icon: icon,
        color: color,
        text: log.descripcion || `${log.usuario_nombre} realizó ${log.accion} ${log.tipo}`,
        time: formatTimeAgo(log.fecha),
        // Datos adicionales para el detalle
        tipo: log.tipo,
        usuario: log.usuario_nombre,
        fecha: log.fecha,
        detalle: log.descripcion,
        metadata: {
          accion: log.accion,
          entidad: log.entidad_nombre,
          rol: log.usuario_rol
        }
      };
    });

  } catch (error) {
    console.error('ERROR ACTIVIDADES RECIENTES:', error);
    // Si la tabla no existe, retornar array vacío
    return [];
  }
};

/**
 * Obtener notificaciones desde logs_actividad
 */
exports.getNotificaciones = async (usuarioId) => {
  try {
    const [logs] = await db.query(`
      SELECT 
        id,
        usuario_nombre,
        tipo,
        accion,
        entidad_nombre,
        descripcion,
        created_at as fecha
      FROM logs_actividad
      ORDER BY created_at DESC
      LIMIT 20
    `);

    // Formatear como notificaciones
    return logs.map(log => ({
      icon: getIconForTipo(log.tipo),
      titulo: log.descripcion || `${log.usuario_nombre} realizó ${log.accion}`,
      time: formatTimeAgo(log.fecha),
      text: log.descripcion,
      tipo: log.tipo
    }));

  } catch (error) {
    console.log('No se pudieron obtener notificaciones:', error.message);
    return [];
  }
};

/**
 * Contar notificaciones no leídas (logs del día de hoy)
 */
exports.contarNotificaciones = async (usuarioId) => {
  try {
    const [result] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM logs_actividad 
      WHERE DATE(created_at) = CURDATE()
    `);
    return result[0].total || 0;
  } catch (error) {
    console.log('No se pudo contar notificaciones:', error.message);
    return 0;
  }
};

/**
 * Marcar notificaciones como leídas
 * (No tenemos tabla de leído, solo retornamos éxito)
 */
exports.marcarNotificacionesLeidas = async (usuarioId) => {
  try {
    // No hacemos nada porque no tenemos tabla de "leído"
    // Solo retornamos éxito
    return true;
  } catch (error) {
    console.log('No se pudieron marcar notificaciones:', error.message);
    return true;
  }
};

// ============================================
// FUNCIONES HELPER
// ============================================

function getIconForTipo(tipo) {
  const icons = {
    'usuario': 'person-add-outline',
    'concurso': 'trophy-outline',
    'proyecto': 'folder-open-outline',
    'asignacion': 'swap-horizontal-outline',
    'evaluacion': 'checkmark-circle-outline',
    'rubrica': 'checkbox-outline',
    'certificado': 'document-text-outline',
    'seccion': 'layers-outline',
    'criterio': 'list-outline',
    'nivel': 'bar-chart-outline',
    'reporte': 'stats-chart-outline'
  };
  return icons[tipo] || 'information-circle-outline';
}

function getColorForTipo(tipo) {
  const colors = {
    'usuario': 'indigo',
    'concurso': 'gold-upse',
    'proyecto': 'cyan-upse',
    'asignacion': 'teal-upse',
    'evaluacion': 'emerald',
    'rubrica': 'orange-upse',
    'certificado': 'blue-upse',
    'seccion': 'violet',
    'criterio': 'rose',
    'nivel': 'amber',
    'reporte': 'slate'
  };
  return colors[tipo] || 'slate';
}

function formatTimeAgo(fecha) {
  if (!fecha) return 'Recientemente';
  
  try {
    const now = new Date();
    const date = new Date(fecha);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES');
  } catch {
    return 'Recientemente';
  }
}