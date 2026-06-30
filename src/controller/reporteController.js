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
      SELECT p.nombre, AVG(e.nota) as promedio
      FROM evaluaciones e
      JOIN proyectos p ON e.proyecto_id = p.id
      GROUP BY p.id
      ORDER BY promedio DESC
    `);

    res.json({
      ok: true,
      data: rows
    });

  } catch (error) {
    console.error('Error en ranking:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener ranking'
    });
  }
};