const db = require('../config/db');

const NivelModel = {

  // Método para obtener niveles por concurso
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

  async create(data) {
    const { concurso_id, nombre, puntaje, descripcion } = data;

    const [result] = await db.query(
      `INSERT INTO niveles (concurso_id, nombre, puntaje, descripcion)
       VALUES (?, ?, ?, ?)`,
      [concurso_id, nombre, puntaje, descripcion || null]
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

  // Obtener nivel por ID
  async getById(id) {
    const [rows] = await db.query(
      `SELECT * FROM niveles WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = NivelModel;