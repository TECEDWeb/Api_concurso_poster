const db = require('../config/db');

const SeccionModel = {

  async getByConcurso(concursoId) {
    const [rows] = await db.query(
      `SELECT * FROM secciones WHERE concurso_id = ? ORDER BY orden ASC`,
      [concursoId]
    );
    return rows;
  },

  async create(data) {
    const { concurso_id, nombre, orden, descripcion } = data;

    const [result] = await db.query(
      `INSERT INTO secciones (concurso_id, nombre, orden, descripcion)
       VALUES (?, ?, ?, ?)`,
      [concurso_id, nombre, orden, descripcion]
    );

    return { id: result.insertId, ...data };
  }
};

module.exports = SeccionModel;