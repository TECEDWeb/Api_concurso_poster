const pool = require('../config/db');

const usuarioModel = {
  async buscarPorCedula(cedula) {
    const [rows] = await pool.query(
      `SELECT id, cedula, nombre, email, telefono, password_hash, rol,
              departamento, activo
       FROM usuarios
       WHERE cedula = ?
       LIMIT 1`,
      [cedula]
    );
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT id, cedula, nombre, email, telefono, rol, departamento, activo
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async crear({ cedula, nombre, email, telefono, password_hash, rol, departamento }) {
    const [result] = await pool.query(
      `INSERT INTO usuarios (cedula, nombre, email, telefono, password_hash, rol, departamento)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cedula, nombre, email || null, telefono || null, password_hash, rol, departamento || null]
    );
    return result.insertId;
  },

  /**
   * Actualizar usuario existente
   */
  async actualizar(id, { cedula, nombre, email, telefono, rol, departamento, activo, password_hash }) {
    let query = `UPDATE usuarios SET 
      cedula = ?,
      nombre = ?,
      email = ?,
      telefono = ?,
      rol = ?,
      departamento = ?,
      activo = ?
    `;
    const params = [cedula, nombre, email || null, telefono || null, rol, departamento || null, activo];

    // Si se proporciona password_hash, actualizarlo
    if (password_hash) {
      query += `, password_hash = ?`;
      params.push(password_hash);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    const [result] = await pool.query(query, params);
    return result.affectedRows > 0;
  },

  async listar({ rol } = {}) {
    if (rol) {
      const [rows] = await pool.query(
        `SELECT id, cedula, nombre, email, telefono, rol, departamento, activo, created_at
         FROM usuarios WHERE rol = ? ORDER BY nombre ASC`,
        [rol]
      );
      return rows;
    }
    const [rows] = await pool.query(
      `SELECT id, cedula, nombre, email, telefono, rol, departamento, activo, created_at
       FROM usuarios ORDER BY nombre ASC`
    );
    return rows;
  },

  /**
   * Cambiar estado de un usuario (activo/inactivo)
   */
  async toggleActivo(id) {
    const [result] = await pool.query(
      'UPDATE usuarios SET activo = NOT activo WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Resetear contraseña de un usuario
   */
  async resetPassword(id, newPasswordHash) {
    const [result] = await pool.query(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [newPasswordHash, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Eliminar un usuario
   */
  async eliminar(id) {
    const [result] = await pool.query(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = usuarioModel;