const db = require('../config/db');

const SeccionModel = {

  async getByConcurso(concursoId) {
    const [rows] = await db.query(
      `SELECT * FROM secciones WHERE concurso_id = ? ORDER BY orden ASC`,
      [concursoId]
    );
    return rows;
  },

  // Alias para compatibilidad
  async obtenerPorConcurso(concursoId) {
    return this.getByConcurso(concursoId);
  },

  async create(data) {
    const { concurso_id, nombre, orden, descripcion } = data;

    const [result] = await db.query(
      `INSERT INTO secciones (concurso_id, nombre, orden, descripcion)
       VALUES (?, ?, ?, ?)`,
      [concurso_id, nombre, orden, descripcion || null]
    );

    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { nombre, orden, descripcion } = data;

    await db.query(
      `UPDATE secciones 
       SET nombre = ?, orden = ?, descripcion = ?
       WHERE id = ?`,
      [nombre, orden, descripcion || null, id]
    );

    return { id, ...data };
  },

  async delete(id) {
    await db.query(
      `DELETE FROM secciones WHERE id = ?`,
      [id]
    );
    return true;
  },

  async getById(id) {
    const [rows] = await db.query(
      `SELECT * FROM secciones WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = SeccionModel;