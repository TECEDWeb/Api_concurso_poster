const db = require('../config/db');

const ReporteService = {

  async stats() {
    const [proyectos] = await db.query(
      'SELECT COUNT(*) as total FROM proyectos'
    );

    const [evaluaciones] = await db.query(
      'SELECT COUNT(*) as total FROM evaluaciones'
    );

    return {
      proyectos: proyectos[0].total,
      evaluaciones: evaluaciones[0].total
    };
  },

  async ranking() {
    const [rows] = await db.query(`
      SELECT p.nombre, AVG(e.nota) as promedio
      FROM evaluaciones e
      JOIN proyectos p ON e.proyecto_id = p.id
      GROUP BY p.id
      ORDER BY promedio DESC
    `);

    return rows;
  }
};

module.exports = ReporteService;