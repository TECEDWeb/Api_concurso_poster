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
      SELECT
        p.nombre,
        ROUND(
          AVG(e.nota),
          2
        ) AS promedio
      FROM evaluaciones e
      INNER JOIN proyectos p
        ON e.proyecto_id = p.id
      GROUP BY
        p.id,
        p.nombre
      ORDER BY
        promedio DESC
    `);

    return rows;
  },

  async proyectos() {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.nombre AS proyecto,
        COUNT(DISTINCT e.id) AS evaluaciones,
        ROUND(
          AVG(n.puntaje),
          2
        ) AS promedio,
        u.nombre AS evaluador,
        u.rol,
        ROUND(
          SUM(n.puntaje),
          2
        ) AS puntaje
      FROM proyectos p
      LEFT JOIN evaluaciones e
        ON e.proyecto_id = p.id
      LEFT JOIN detalles_evaluacion d
        ON d.evaluacion_id = e.id
      LEFT JOIN niveles n
        ON n.id = d.nivel_id
      LEFT JOIN usuarios u
        ON u.id = e.evaluador_id
      GROUP BY
        p.id,
        p.nombre,
        u.id,
        u.nombre,
        u.rol
      ORDER BY
        p.nombre ASC
    `);

    const proyectos = [];
    rows.forEach(row => {
      let proyecto = proyectos.find(
        item => item.proyecto === row.proyecto
      );

      if (!proyecto) {
        proyecto = {
          proyecto: row.proyecto,
          evaluaciones: row.evaluaciones,
          promedio: row.promedio,
          evaluadores: []
        };
        proyectos.push(proyecto);
      }
      if(row.evaluador){
        proyecto.evaluadores.push({
          nombre: row.evaluador,
          rol: row.rol,
          puntaje: row.puntaje
        });
      }
    });
    return proyectos;
  }

};


module.exports = ReporteService;