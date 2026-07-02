const db = require('../config/db');

/**
 * LISTAR SOLO EVALUADORES
 */
exports.getEvaluadores = async (req, res) => {
  try {
    console.log('GET EVALUADORES');

    const [rows] = await db.query(
      'SELECT id, cedula, nombre, email, telefono, rol, departamento, activo, created_at FROM usuarios WHERE rol = ?',
      ['evaluador']
    );

    return res.json({
      ok: true,
      data: rows
    });

  } catch (err) {
    console.error('ERROR getEvaluadores:', err.message);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener evaluadores'
    });
  }
};


/**
 * CREAR USUARIO
 */
exports.create = async (req, res) => {
  try {
    console.log('CREATE USUARIO:', req.body);

    const { cedula, nombre, email, telefono, password_hash, rol, departamento } = req.body;

    if (!cedula || !nombre || !password_hash || !rol) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan campos obligatorios'
      });
    }

    const [result] = await db.query(
      `INSERT INTO usuarios (cedula, nombre, email, telefono, password_hash, rol, departamento)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cedula, nombre, email || null, telefono || null, password_hash, rol, departamento || null]
    );

    return res.json({
      ok: true,
      mensaje: 'Usuario creado correctamente',
      data: {
        id: result.insertId,
        cedula,
        nombre,
        email,
        rol
      }
    });

  } catch (err) {
    console.error('ERROR create usuario:', err.message);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al crear usuario'
    });
  }
};


/**
 * CAMBIAR ESTADO (activo/inactivo)
 */
exports.toggleActivo = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE usuarios SET activo = NOT activo WHERE id = ?',
      [id]
    );

    return res.json({
      ok: true,
      mensaje: 'Estado actualizado'
    });

  } catch (err) {
    console.error('ERROR toggleActivo:', err.message);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar estado'
    });
  }
};


/**
 * LISTAR TODOS LOS USUARIOS (ADMIN)
 */
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, cedula, nombre, email, telefono, rol, departamento, activo, created_at
       FROM usuarios
       ORDER BY nombre ASC`
    );

    return res.json({
      ok: true,
      data: rows
    });

  } catch (err) {
    console.error('ERROR listar usuarios:', err.message);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al listar usuarios'
    });
  }
};


/**
 * BUSCAR POR ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT id, cedula, nombre, email, telefono, rol, departamento, activo
       FROM usuarios
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    return res.json({
      ok: true,
      data: rows[0]
    });

  } catch (err) {
    console.error('ERROR getById:', err.message);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener usuario'
    });
  }
};