const pool = require('../config/db');

const proyectoModel = {

  async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        c.nombre AS concurso_nombre
      FROM proyectos p
      LEFT JOIN concursos c ON p.concurso_id = c.id
      ORDER BY p.id DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        c.nombre AS concurso_nombre
      FROM proyectos p
      LEFT JOIN concursos c ON p.concurso_id = c.id
      WHERE p.id = ? LIMIT 1
    `, [id]);

    return rows[0] || null;
  },

  async create({ concurso_id, nombre, descripcion, estudiante_nombre, nivel, area, activo }) {
    const [result] = await pool.query(`
      INSERT INTO proyectos (concurso_id, nombre, descripcion, estudiante_nombre, nivel, area, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      concurso_id || null,
      nombre,
      descripcion || null,
      estudiante_nombre,
      nivel || null,
      area || null,
      activo !== undefined ? activo : 1
    ]);

    return {
      id: result.insertId,
      concurso_id,
      nombre,
      descripcion,
      estudiante_nombre,
      nivel,
      area,
      activo: activo !== undefined ? activo : 1
    };
  },

  async update(id, { concurso_id, nombre, descripcion, estudiante_nombre, nivel, area, activo }) {
    await pool.query(`
      UPDATE proyectos
      SET concurso_id = ?, nombre = ?, descripcion = ?, estudiante_nombre = ?, nivel = ?, area = ?, activo = ?
      WHERE id = ?
    `, [
      concurso_id || null,
      nombre,
      descripcion || null,
      estudiante_nombre,
      nivel || null,
      area || null,
      activo !== undefined ? activo : 1,
      id
    ]);

    return true;
  },

  async remove(id) {
    await pool.query(`DELETE FROM proyectos WHERE id = ?`, [id]);
    return true;
  },

  async assignEvaluadores(proyectoId, evaluadoresIds) {
    await pool.query(
      `DELETE FROM proyecto_evaluadores WHERE proyecto_id = ?`,
      [proyectoId]
    );

    for (const evaluadorId of evaluadoresIds) {
      await pool.query(
        `INSERT INTO proyecto_evaluadores (proyecto_id, evaluador_id)
         VALUES (?, ?)`,
        [proyectoId, evaluadorId]
      );
    }

    return true;
  }
};

module.exports = proyectoModel;