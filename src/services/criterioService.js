const db = require('../config/db');

const CriterioService = {

  async getAll() {
    const [rows] = await db.query('SELECT * FROM criterios');
    return rows;
  },

  async create(data) {
    const { nombre, peso } = data;

    const [result] = await db.query(
      'INSERT INTO criterios (nombre, peso) VALUES (?, ?)',
      [nombre, peso]
    );

    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { nombre, peso } = data;

    await db.query(
      'UPDATE criterios SET nombre=?, peso=? WHERE id=?',
      [nombre, peso, id]
    );

    return true;
  },

  async delete(id) {
    await db.query('DELETE FROM criterios WHERE id=?', [id]);
    return true;
  }
};

module.exports = CriterioService;