const db = require('../config/db');

const NivelModel = {

  // Obtener niveles por concurso (niveles generales del concurso)
  async getByConcurso(concursoId) {
    const [rows] = await db.query(
      `SELECT * FROM niveles WHERE concurso_id = ? ORDER BY puntaje ASC`,
      [concursoId]
    );
    return rows;
  },

  // Alias para compatibilidad
  async obtenerPorConcurso(concursoId) {
    return this.getByConcurso(concursoId);
  },

  // Obtener niveles por criterio (niveles específicos de un criterio)
  async getByCriterio(criterioId) {
    const [rows] = await db.query(
      `SELECT * FROM niveles WHERE criterio_id = ? ORDER BY puntaje ASC`,
      [criterioId]
    );
    return rows;
  },

  // Alias para compatibilidad
  async obtenerPorCriterio(criterioId) {
    return this.getByCriterio(criterioId);
  },

  async create(data) {
    const { concurso_id, criterio_id, nombre, puntaje, descripcion } = data;

    const [result] = await db.query(
      `INSERT INTO niveles (concurso_id, criterio_id, nombre, puntaje, descripcion)
       VALUES (?, ?, ?, ?, ?)`,
      [concurso_id || null, criterio_id || null, nombre, puntaje, descripcion || null]
    );

    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { nombre, puntaje, descripcion } = data;

    await db.query(
      `UPDATE niveles 
       SET nombre = ?, puntaje = ?, descripcion = ?
       WHERE id = ?`,
      [nombre, puntaje, descripcion || null, id]
    );

    return { id, ...data };
  },

  async delete(id) {
    await db.query(
      `DELETE FROM niveles WHERE id = ?`,
      [id]
    );
    return true;
  },

  async getById(id) {
    const [rows] = await db.query(
      `SELECT * FROM niveles WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = NivelModel;