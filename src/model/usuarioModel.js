const db = require('../config/db');

const usuarioModel = {
  async listar({ rol } = {}) {
    let query = 'SELECT id, cedula, nombre, email, telefono, rol, departamento, activo, created_at FROM usuarios';
    const params = [];

    if (rol) {
      query += ' WHERE rol = ?';
      params.push(rol);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  async getEvaluadores() {
    const [rows] = await db.query(
      `SELECT id, cedula, nombre, email, telefono, rol, departamento, activo 
       FROM usuarios 
       WHERE rol = 'evaluador' AND activo = 1
       ORDER BY nombre ASC`
    );
    return rows;
  },

  async buscarPorCedula(cedula) {
    const [rows] = await db.query(
      `SELECT id, cedula, nombre, email, telefono, rol, departamento, activo, password_hash 
       FROM usuarios 
       WHERE cedula = ?`,
      [cedula]
    );
    return rows[0] || null;
  },

  async buscarPorEmail(email) {
    const [rows] = await db.query(
      `SELECT id, cedula, nombre, email, telefono, rol, departamento, activo, password_hash 
       FROM usuarios 
       WHERE email = ?`,
      [email]
    );
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const [rows] = await db.query(
      `SELECT id, cedula, nombre, email, telefono, rol, departamento, activo, created_at 
       FROM usuarios 
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async crear({ cedula, nombre, email, telefono, password_hash, rol, departamento }) {
    const [result] = await db.query(
      `INSERT INTO usuarios 
       (cedula, nombre, email, telefono, password_hash, rol, departamento, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [cedula, nombre, email, telefono || null, password_hash, rol, departamento || null]
    );
    return result.insertId;
  },

  async actualizar(id, { cedula, nombre, email, telefono, rol, departamento, activo, password_hash }) {
    let query = 'UPDATE usuarios SET ';
    const params = [];
    const updates = [];

    if (cedula !== undefined) {
      updates.push('cedula = ?');
      params.push(cedula);
    }
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (telefono !== undefined) {
      updates.push('telefono = ?');
      params.push(telefono);
    }
    if (rol !== undefined) {
      updates.push('rol = ?');
      params.push(rol);
    }
    if (departamento !== undefined) {
      updates.push('departamento = ?');
      params.push(departamento);
    }
    if (activo !== undefined) {
      updates.push('activo = ?');
      params.push(activo);
    }
    if (password_hash !== undefined && password_hash !== null) {
      updates.push('password_hash = ?');
      params.push(password_hash);
    }

    if (updates.length === 0) {
      return false;
    }

    query += updates.join(', ');
    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  },

  async toggleActivo(id) {
    const [usuario] = await db.query(
      `SELECT activo FROM usuarios WHERE id = ?`,
      [id]
    );

    if (!usuario.length) return false;

    const nuevoEstado = usuario[0].activo ? 0 : 1;

    const [result] = await db.query(
      `UPDATE usuarios SET activo = ? WHERE id = ?`,
      [nuevoEstado, id]
    );

    return result.affectedRows > 0;
  },

  async resetPassword(id, password_hash) {
    const [result] = await db.query(
      `UPDATE usuarios SET password_hash = ? WHERE id = ?`,
      [password_hash, id]
    );
    return result.affectedRows > 0;
  },

  async eliminar(id) {
    const [result] = await db.query(
      `DELETE FROM usuarios WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = usuarioModel;