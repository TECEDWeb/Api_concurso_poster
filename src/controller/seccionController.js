const db = require('../config/db');

// =========================
// GET ALL SECCIONES
// =========================
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM secciones');

    return res.json({
      ok: true,
      data: rows || []
    });

  } catch (error) {
    console.error('ERROR getAll secciones:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener secciones'
    });
  }
};

// =========================
// CREATE SECCION
// =========================
exports.create = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre es obligatorio'
      });
    }

    await db.query(
      'INSERT INTO secciones (nombre) VALUES (?)',
      [nombre]
    );

    return res.json({
      ok: true,
      mensaje: 'Sección creada'
    });

  } catch (error) {
    console.error('ERROR create seccion:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al crear sección'
    });
  }
};

// =========================
// UPDATE SECCION
// =========================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre es obligatorio'
      });
    }

    await db.query(
      'UPDATE secciones SET nombre=? WHERE id=?',
      [nombre, id]
    );

    return res.json({
      ok: true,
      mensaje: 'Sección actualizada'
    });

  } catch (error) {
    console.error('ERROR update seccion:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar sección'
    });
  }
};

// =========================
// DELETE SECCION
// =========================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'DELETE FROM secciones WHERE id=?',
      [id]
    );

    return res.json({
      ok: true,
      mensaje: 'Sección eliminada'
    });

  } catch (error) {
    console.error('ERROR delete seccion:', error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar sección'
    });
  }
};