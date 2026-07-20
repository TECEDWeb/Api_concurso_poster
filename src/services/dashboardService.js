const db = require('../config/db');

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
 * Obtener actividades recientes
 */
exports.getActividadesRecientes = async (limite = 5) => {
  try {
    // Obtener evaluaciones recientes
    const [evaluaciones] = await db.query(`
      SELECT 
        e.id,
        'evaluacion' AS tipo,
        p.nombre AS proyecto_nombre,
        u.nombre AS evaluador_nombre,
        e.fecha_evaluacion AS fecha
      FROM evaluaciones e
      LEFT JOIN proyectos p ON e.proyecto_id = p.id
      LEFT JOIN usuarios u ON e.evaluador_id = u.id
      WHERE e.fecha_evaluacion IS NOT NULL
      ORDER BY e.fecha_evaluacion DESC
      LIMIT ?
    `, [limite]);

    // Obtener proyectos recientes
    const [proyectos] = await db.query(`
      SELECT 
        p.id,
        'proyecto' AS tipo,
        p.nombre AS proyecto_nombre,
        c.nombre AS concurso_nombre,
        p.created_at AS fecha
      FROM proyectos p
      LEFT JOIN concursos c ON p.concurso_id = c.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `, [limite]);

    // Combinar y ordenar por fecha
    const actividades = [...evaluaciones, ...proyectos];
    actividades.sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
      const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
      return fechaB - fechaA;
    });

    // Formatear para el frontend
    return actividades.slice(0, limite).map(act => {
      if (act.tipo === 'evaluacion') {
        return {
          icon: 'document-text-outline',
          color: 'violet',
          text: `Evaluación completada: ${act.proyecto_nombre || 'Proyecto'}`,
          time: formatTimeAgo(act.fecha)
        };
      } else {
        return {
          icon: 'folder-open-outline',
          color: 'emerald',
          text: `Nuevo proyecto: ${act.proyecto_nombre || 'Sin nombre'}`,
          time: formatTimeAgo(act.fecha)
        };
      }
    });

  } catch (error) {
    console.error('ERROR ACTIVIDADES RECIENTES:', error);
    return [];
  }
};

/**
 * Obtener notificaciones del usuario
 */
exports.getNotificaciones = async (usuarioId) => {
  try {
    // Verificar si existe la tabla notificaciones
    const [result] = await db.query(`
      SELECT COUNT(*) AS count 
      FROM information_schema.tables 
      WHERE table_schema = 'evaluacion_proyectos' 
      AND table_name = 'notificaciones'
    `);

    if (result[0].count === 0) {
      // Si no existe la tabla, devolver datos mock o vacío
      return [];
    }

    const [notificaciones] = await db.query(`
      SELECT 
        id,
        titulo,
        mensaje,
        leida,
        fecha_creacion AS fecha
      FROM notificaciones
      WHERE usuario_id = ?
      ORDER BY fecha_creacion DESC
      LIMIT 20
    `, [usuarioId]);

    return notificaciones || [];

  } catch (error) {
    console.log('No se pudieron obtener notificaciones:', error.message);
    return [];
  }
};

/**
 * Contar notificaciones no leídas
 */
exports.contarNotificaciones = async (usuarioId) => {
  try {
    // Verificar si existe la tabla notificaciones
    const [result] = await db.query(`
      SELECT COUNT(*) AS count 
      FROM information_schema.tables 
      WHERE table_schema = 'evaluacion_proyectos' 
      AND table_name = 'notificaciones'
    `);

    if (result[0].count === 0) {
      return 0;
    }

    const [notificaciones] = await db.query(`
      SELECT COUNT(*) AS count
      FROM notificaciones
      WHERE usuario_id = ? AND leida = 0
    `, [usuarioId]);

    return notificaciones[0].count || 0;

  } catch (error) {
    console.log('No se pudo contar notificaciones:', error.message);
    return 0;
  }
};

/**
 * Marcar notificaciones como leídas
 */
exports.marcarNotificacionesLeidas = async (usuarioId) => {
  try {
    await db.query(`
      UPDATE notificaciones
      SET leida = 1
      WHERE usuario_id = ? AND leida = 0
    `, [usuarioId]);

    return true;

  } catch (error) {
    console.log('No se pudieron marcar notificaciones:', error.message);
    return true;
  }
};

/**
 * Función auxiliar para formatear tiempo
 */
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