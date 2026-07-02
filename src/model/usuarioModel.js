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

  /**
   * Busca un usuario por id (útil para validar el token en cada request).
   */
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

  /**
   * Crea un nuevo usuario (administrador o evaluador).
   * password_hash debe llegar YA hasheado (lo hace authService).
   */
  async crear({ cedula, nombre, email, telefono, password_hash, rol, departamento }) {
    const [result] = await pool.query(
      `INSERT INTO usuarios (cedula, nombre, email, telefono, password_hash, rol, departamento)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cedula, nombre, email || null, telefono || null, password_hash, rol, departamento || null]
    );
    return result.insertId;
  },

  /**
   * Lista usuarios, opcionalmente filtrados por rol.
   * Pensado para que el administrador gestione evaluadores.
   */
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
};

module.exports = usuarioModel;
