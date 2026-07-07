const db = require('../config/db'); // mysql2/promise pool

exports.getAdminStats = async () => {
  try {
    // Contar usuarios
    const [usuarios] = await db.query(
      'SELECT COUNT(*) AS total FROM usuarios'
    );

    // Contar proyectos (concursos en el frontend)
    const [proyectos] = await db.query(
      'SELECT COUNT(*) AS total FROM proyectos'
    );

    // Contar concursos (si existe la tabla)
    let concursos = 0;
    try {
      const [concursosResult] = await db.query(
        'SELECT COUNT(*) AS total FROM concursos'
      );
      concursos = concursosResult[0].total;
    } catch (e) {
      // Si no existe la tabla concursos, usar proyectos
      concursos = proyectos[0].total;
    }

    // Contar evaluaciones (reportes en el frontend)
    const [evaluaciones] = await db.query(
      'SELECT COUNT(*) AS total FROM evaluaciones'
    );

    // Contar evaluaciones completadas
    const [completadas] = await db.query(
      "SELECT COUNT(*) AS total FROM evaluaciones WHERE estado = 'completada'"
    );

    // Calcular promedio de puntajes
    const [promedioResult] = await db.query(
      'SELECT AVG(puntaje_total) AS promedio FROM evaluaciones WHERE puntaje_total IS NOT NULL'
    );
    const promedio = promedioResult[0].promedio || 0;

    return {
      usuarios: usuarios[0].total,
      concursos: concursos,
      proyectos: proyectos[0].total,
      evaluaciones: evaluaciones[0].total,
      completadas: completadas[0].total,
      promedio: Math.round(promedio * 10) / 10
    };

  } catch (error) {
    console.error('❌ ERROR DASHBOARD SERVICE:', error);
    throw error;
  }
};

/**
 * Obtener actividades recientes
 */
exports.getActividadesRecientes = async (limite = 5) => {
  try {
    // Obtener últimas evaluaciones
    const [evaluaciones] = await db.query(`
      SELECT 
        e.id,
        'evaluacion' AS tipo,
        p.nombre AS proyecto_nombre,
        u.nombre AS evaluador_nombre,
        e.fecha_creacion AS fecha
      FROM evaluaciones e
      JOIN proyectos p ON e.proyecto_id = p.id
      JOIN usuarios u ON e.evaluador_id = u.id
      ORDER BY e.fecha_creacion DESC
      LIMIT ?
    `, [limite]);

    // Obtener últimos proyectos creados
    const [proyectos] = await db.query(`
      SELECT 
        p.id,
        'proyecto' AS tipo,
        p.nombre AS proyecto_nombre,
        u.nombre AS creador_nombre,
        p.fecha_creacion AS fecha
      FROM proyectos p
      JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY p.fecha_creacion DESC
      LIMIT ?
    `, [limite]);

    // Combinar y ordenar por fecha
    const actividades = [...evaluaciones, ...proyectos];
    actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Formatear para el frontend
    return actividades.slice(0, limite).map(act => ({
      icon: act.tipo === 'evaluacion' ? 'document-text-outline' : 'folder-open-outline',
      color: act.tipo === 'evaluacion' ? 'violet' : 'emerald',
      text: act.tipo === 'evaluacion' 
        ? `Evaluación completada: ${act.proyecto_nombre}`
        : `Nuevo proyecto creado: ${act.proyecto_nombre}`,
      time: formatTimeAgo(act.fecha)
    }));

  } catch (error) {
    console.error('❌ ERROR ACTIVIDADES RECIENTES:', error);
    return [];
  }
};

/**
 * Obtener notificaciones del usuario
 */
exports.getNotificaciones = async (usuarioId) => {
  try {
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

    return notificaciones;

  } catch (error) {
    console.error('❌ ERROR NOTIFICACIONES:', error);
    return [];
  }
};

/**
 * Contar notificaciones no leídas
 */
exports.contarNotificaciones = async (usuarioId) => {
  try {
    const [result] = await db.query(`
      SELECT COUNT(*) AS count
      FROM notificaciones
      WHERE usuario_id = ? AND leida = 0
    `, [usuarioId]);

    return result[0].count || 0;

  } catch (error) {
    console.error('❌ ERROR CONTAR NOTIFICACIONES:', error);
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
    console.error('❌ ERROR MARCAR NOTIFICACIONES:', error);
    throw error;
  }
};

/**
 * Función auxiliar para formatear tiempo
 */
function formatTimeAgo(fecha) {
  if (!fecha) return 'Recientemente';
  
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
}