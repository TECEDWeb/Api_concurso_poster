const pool = require('../config/db');

const proyectoModel = {

  async getAll() {
    const [rows] = await pool.query(`
      SELECT * FROM proyectos ORDER BY id DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT * FROM proyectos WHERE id = ? LIMIT 1
    `, [id]);

    return rows[0] || null;
  },

  async create({ nombre, descripcion, concursoId }) {
    const [result] = await pool.query(`
      INSERT INTO proyectos (nombre, descripcion, concurso_id, activo)
      VALUES (?, ?, ?, 1)
    `, [
      nombre,
      descripcion || null,
      concursoId
    ]);

    return {
      id: result.insertId,
      nombre,
      descripcion,
      concursoId
    };
  },

  async update(id, { nombre, descripcion, nivel, activo }) {
    await pool.query(`
      UPDATE proyectos
      SET nombre = ?, descripcion = ?, nivel = ?, activo = ?
      WHERE id = ?
    `, [nombre, descripcion, nivel, activo, id]);

    return true;
  },

  async remove(id) {
    await pool.query(`DELETE FROM proyectos WHERE id = ?`, [id]);
    return true;
  },

  // 🔥 ASIGNACIÓN DE EVALUADORES (TABLA INTERMEDIA)
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