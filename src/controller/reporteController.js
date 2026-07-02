const db = require('../config/db');

// =========================
// STATS GENERALES
// =========================
exports.stats = async (req, res) => {
  try {
    const [proyectos] = await db.query(
      'SELECT COUNT(*) as total FROM proyectos'
    );

    const [evaluaciones] = await db.query(
      'SELECT COUNT(*) as total FROM evaluaciones'
    );

    res.json({
      ok: true,
      proyectos: proyectos[0].total,
      evaluaciones: evaluaciones[0].total
    });

  } catch (error) {
    console.error('Error en stats:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener estadísticas'
    });
  }
};

// =========================
// RANKING DE PROYECTOS
// =========================
exports.ranking = async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT
        titulo_proyecto,
        ROUND(AVG(porcentaje), 2) AS promedio,
        COUNT(*) AS total_evaluaciones,
        MAX(calificacion_cualitativa) AS calificacion
      FROM vista_resumen_evaluaciones
      GROUP BY titulo_proyecto
      ORDER BY promedio DESC
    `);

    res.json({
      ok: true,
      data: rows
    });

  } catch (error) {

    console.error('==========================');
    console.error('ERROR RANKING');
    console.error(error);
    console.error('==========================');

    res.status(500).json({
      ok: false,
      mensaje: error.message
    });
  }
};