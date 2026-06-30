const db = require('../config/db');

const CriterioModel = {

  async getBySeccion(seccionId) {
    const [rows] = await db.query(
      `SELECT * FROM criterios WHERE seccion_id = ? ORDER BY orden ASC`,
      [seccionId]
    );
    return rows;
  },

  async create(data) {
    const { seccion_id, texto, orden } = data;

    const [result] = await db.query(
      `INSERT INTO criterios (seccion_id, texto, orden)
       VALUES (?, ?, ?)`,
      [seccion_id, texto, orden]
    );

    return { id: result.insertId, ...data };
  }
};

module.exports = CriterioModel;