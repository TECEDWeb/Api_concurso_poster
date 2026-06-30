const db = require('../config/db');

const NivelModel = {

  async getByConcurso(concursoId) {
    const [rows] = await db.query(
      `SELECT * FROM niveles WHERE concurso_id = ? ORDER BY puntaje ASC`,
      [concursoId]
    );
    return rows;
  },

  async create(data) {
    const { concurso_id, nombre, puntaje, descripcion } = data;

    const [result] = await db.query(
      `INSERT INTO niveles (concurso_id, nombre, puntaje, descripcion)
       VALUES (?, ?, ?, ?)`,
      [concurso_id, nombre, puntaje, descripcion]
    );

    return { id: result.insertId, ...data };
  }
};

module.exports = NivelModel;