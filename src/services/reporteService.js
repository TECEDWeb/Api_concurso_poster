// Si prefieres usar el patrón de servicios, aquí están los métodos
const db = require('../config/db');

const ReporteService = {
  // ... métodos existentes ...

  // ==============================
  // DETALLE DE PROYECTO
  // ==============================
  async getDetalleProyecto(proyectoId) {
    // Obtener proyecto
    const [proyectos] = await db.query(
      `SELECT id, nombre, descripcion FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      return null;
    }

    const proyecto = proyectos[0];

    // Obtener evaluaciones
    const [evaluaciones] = await db.query(`
      SELECT 
        e.id,
        u.nombre AS evaluador,
        u.rol,
        e.estado,
        e.fecha_evaluacion,
        e.observaciones,
        ROUND(SUM(n.puntaje), 2) AS puntaje_total
      FROM evaluaciones e
      JOIN usuarios u ON u.id = e.evaluador_id
      LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      LEFT JOIN niveles n ON n.id = d.nivel_id
      WHERE e.proyecto_id = ?
      GROUP BY e.id, u.nombre, u.rol, e.estado, e.fecha_evaluacion, e.observaciones
      ORDER BY e.fecha_evaluacion DESC
    `, [proyectoId]);

    // Obtener evaluadores
    const [evaluadores] = await db.query(`
      SELECT 
        u.nombre,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntaje,
        ROUND(AVG(n.puntaje), 2) AS promedio
      FROM evaluaciones e
      JOIN usuarios u ON u.id = e.evaluador_id
      LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      LEFT JOIN niveles n ON n.id = d.nivel_id
      WHERE e.proyecto_id = ?
      GROUP BY u.id, u.nombre, u.rol
      ORDER BY puntaje DESC
    `, [proyectoId]);

    // Calcular promedio
    const [promedioResult] = await db.query(`
      SELECT ROUND(AVG(total_puntaje), 2) AS promedio FROM (
        SELECT SUM(n.puntaje) AS total_puntaje
        FROM evaluaciones e
        JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
        JOIN niveles n ON n.id = d.nivel_id
        WHERE e.proyecto_id = ?
        GROUP BY e.id
      ) AS puntajes
    `, [proyectoId]);

    return {
      id: proyecto.id,
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion || '',
      evaluaciones: evaluaciones,
      evaluadores: evaluadores,
      promedio: promedioResult[0]?.promedio || 0,
      totalEvaluaciones: evaluaciones.length
    };
  },

  // ==============================
  // EXPORTAR EXCEL POR PROYECTO
  // ==============================
  async exportarProyecto(proyectoId) {
    const [proyectos] = await db.query(
      `SELECT id, nombre FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      return null;
    }

    const proyecto = proyectos[0];

    const [rows] = await db.query(`
      SELECT
        u.nombre AS evaluador,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntaje,
        ROUND(AVG(n.puntaje), 2) AS promedio
      FROM evaluaciones e
      JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      JOIN niveles n ON n.id = d.nivel_id
      JOIN usuarios u ON u.id = e.evaluador_id
      WHERE e.proyecto_id = ?
      GROUP BY u.id, u.nombre, u.rol
      ORDER BY puntaje DESC
    `, [proyectoId]);

    return { proyecto, evaluadores: rows };
  }
};

module.exports = ReporteService;