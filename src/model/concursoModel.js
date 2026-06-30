const pool = require('../config/db');

const concursoModel = {

  async listar() {
    const [rows] = await pool.query(`
      SELECT *
      FROM concursos
      ORDER BY created_at DESC
    `);

    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT *
       FROM concursos
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  },

  async crear(data) {
    const {
      nombre,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      puntaje_maximo,
      activo
    } = data;

    const [result] = await pool.query(
      `INSERT INTO concursos
      (nombre, descripcion, tipo, fecha_inicio, fecha_fin, puntaje_maximo, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        descripcion || null,
        tipo || null,
        fecha_inicio || null,
        fecha_fin || null,
        puntaje_maximo || null,
        activo ?? true
      ]
    );

    return result.insertId;
  },

  async actualizar(id, data) {

    const {
      nombre,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      puntaje_maximo,
      activo
    } = data;

    await pool.query(
      `UPDATE concursos
       SET nombre=?,
           descripcion=?,
           tipo=?,
           fecha_inicio=?,
           fecha_fin=?,
           puntaje_maximo=?,
           activo=?
       WHERE id=?`,
      [
        nombre,
        descripcion,
        tipo,
        fecha_inicio,
        fecha_fin,
        puntaje_maximo,
        activo,
        id
      ]
    );
  },

  async eliminar(id) {

    await pool.query(
      `DELETE FROM concursos
       WHERE id=?`,
      [id]
    );

  }

};

module.exports = concursoModel;