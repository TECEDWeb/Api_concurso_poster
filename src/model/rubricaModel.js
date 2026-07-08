const db = require('../config/db');

const RubricaModel = {

  // Obtener todas las rúbricas
  async getAll() {
    const [rows] = await db.query(`
      SELECT * FROM rubricas ORDER BY created_at DESC
    `);
    return rows;
  },

  // Obtener rúbrica por ID
  async getById(id) {
    const [rows] = await db.query(
      `SELECT * FROM rubricas WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Obtener rúbrica por concurso_id
  async getByConcurso(concursoId) {
    const [rows] = await db.query(
      `SELECT * FROM rubricas WHERE concurso_id = ?`,
      [concursoId]
    );
    return rows[0] || null;
  },

  // Crear rúbrica
  async create(data) {
    const { concurso_id, nombre, descripcion, puntaje_maximo, estado } = data;

    const [result] = await db.query(
      `INSERT INTO rubricas (concurso_id, nombre, descripcion, puntaje_maximo, estado)
       VALUES (?, ?, ?, ?, ?)`,
      [concurso_id, nombre, descripcion || null, puntaje_maximo || 100, estado || 'ACTIVA']
    );

    return result.insertId;
  },

  // Actualizar rúbrica
  async update(id, data) {
    const { nombre, descripcion, puntaje_maximo, estado } = data;

    await db.query(
      `UPDATE rubricas 
       SET nombre = ?, descripcion = ?, puntaje_maximo = ?, estado = ?
       WHERE id = ?`,
      [nombre, descripcion || null, puntaje_maximo || 100, estado || 'ACTIVA', id]
    );

    return true;
  },

  // Eliminar rúbrica
  async delete(id) {
    await db.query(
      `DELETE FROM rubricas WHERE id = ?`,
      [id]
    );
    return true;
  },

  // Cambiar estado de rúbrica
  async toggleEstado(id) {
    await db.query(
      `UPDATE rubricas 
       SET estado = CASE WHEN estado = 'ACTIVA' THEN 'INACTIVA' ELSE 'ACTIVA' END
       WHERE id = ?`,
      [id]
    );
    return true;
  }
};

module.exports = RubricaModel;