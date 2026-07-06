const db = require('../config/db');

// =========================
// STATS GENERALES
// =========================
exports.stats = async (req, res) => {
  try {
    const [[proyectos]] = await db.query(
      'SELECT COUNT(*) AS total FROM proyectos'
    );

    const [[evaluaciones]] = await db.query(
      'SELECT COUNT(*) AS total FROM evaluaciones'
    );

    return res.json({
      ok: true,
      data: {
        proyectos: proyectos.total,
        evaluaciones: evaluaciones.total
      }
    });

  } catch (error) {
    console.error('ERROR stats:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener estadísticas'
    });
  }
};

// =========================
// RANKING CORREGIDO
// =========================
exports.ranking = async (req, res) => {
    try {

      const [rows] = await db.query(`
        SELECT
          p.nombre,
          ROUND(SUM(n.puntaje), 2) AS puntaje_total,
          COUNT(d.id) AS total_items,
          ROUND((SUM(n.puntaje) * 100.0) / 60, 2) AS promedio,
          CASE
            WHEN SUM(n.puntaje) >= 53 THEN 'Sobresaliente'
            WHEN SUM(n.puntaje) >= 46 THEN 'Bueno'
            WHEN SUM(n.puntaje) >= 36 THEN 'Regular'
            ELSE 'Insuficiente'
          END AS calificacion
        FROM evaluaciones e
        INNER JOIN proyectos p
          ON p.id = e.proyecto_id
        INNER JOIN detalles_evaluacion d
          ON d.evaluacion_id = e.id
        INNER JOIN niveles n
          ON n.id = d.nivel_id
        GROUP BY p.id, p.nombre
        ORDER BY promedio DESC
      `);

      return res.json({
        ok: true,
        data: rows
      });

    } catch (error) {

      console.error('ERROR RANKING:', error);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al generar ranking'
      });

    }
  };