const db = require('../config/db');

const SeccionService = {

  async getAll() {
    const [rows] = await db.query('SELECT * FROM secciones');
    return rows;
  },

  async create(data) {
    const { nombre } = data;

    const [result] = await db.query(
      'INSERT INTO secciones (nombre) VALUES (?)',
      [nombre]
    );

    return { id: result.insertId, nombre };
  },

  async update(id, data) {
    await db.query(
      'UPDATE secciones SET nombre=? WHERE id=?',
      [data.nombre, id]
    );

    return true;
  },

  async delete(id) {
    await db.query('DELETE FROM secciones WHERE id=?', [id]);
    return true;
  }
};

module.exports = SeccionService;