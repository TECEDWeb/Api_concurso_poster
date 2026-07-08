const db = require('../config/db');

const CriterioModel = {

  async getBySeccion(seccionId) {
    const [rows] = await db.query(
      `SELECT * FROM criterios WHERE seccion_id = ? ORDER BY orden ASC`,
      [seccionId]
    );
    return rows;
  },

  // Alias para compatibilidad
  async obtenerPorSeccion(seccionId) {
    return this.getBySeccion(seccionId);
  },

  // 🔥 NUEVO: Obtener criterios por rubrica_id
  async getByRubrica(rubricaId) {
    const [rows] = await db.query(
      `SELECT * FROM criterios WHERE rubrica_id = ? ORDER BY orden ASC`,
      [rubricaId]
    );
    return rows;
  },

  // Alias
  async obtenerPorRubrica(rubricaId) {
    return this.getByRubrica(rubricaId);
  },

  async create(data) {
    const { seccion_id, rubrica_id, texto, orden } = data;

    const [result] = await db.query(
      `INSERT INTO criterios (seccion_id, rubrica_id, texto, orden)
       VALUES (?, ?, ?, ?)`,
      [seccion_id || null, rubrica_id || null, texto, orden]
    );

    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { texto, orden } = data;

    await db.query(
      `UPDATE criterios 
       SET texto = ?, orden = ?
       WHERE id = ?`,
      [texto, orden, id]
    );

    return { id, ...data };
  },

  async delete(id) {
    await db.query(
      `DELETE FROM criterios WHERE id = ?`,
      [id]
    );
    return true;
  },

  async getById(id) {
    const [rows] = await db.query(
      `SELECT * FROM criterios WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = CriterioModel;