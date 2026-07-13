const db = require('../config/db');

// GET /api/niveles?concursoId=5   → escala global
// GET /api/niveles?criterioId=40  → override específico
exports.getAll = async (req, res) => {
  try {
    const { concursoId, criterioId } = req.query;

    let query = 'SELECT * FROM niveles';
    const params = [];

    if (criterioId) {
      query += ' WHERE criterio_id = ?';
      params.push(criterioId);
    } else if (concursoId) {
      query += ' WHERE concurso_id = ? AND criterio_id IS NULL';
      params.push(concursoId);
    }

    query += ' ORDER BY puntaje DESC';

    const [rows] = await db.query(query, params);

    return res.json({ ok: true, data: rows || [] });

  } catch (error) {
    console.error('ERROR getAll niveles:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener niveles' });
  }
};

// POST /api/niveles
// Body: { concursoId, nombre, puntaje, descripcion, criterioId? }
// Si viene criterioId → nivel personalizado de ese criterio
// Si no → nivel de la escala global del concurso
exports.create = async (req, res) => {
  try {
    const { concursoId, nombre, puntaje, descripcion, criterioId } = req.body;

    if (!concursoId || !nombre || puntaje == null) {
      return res.status(400).json({
        ok: false,
        mensaje: 'concursoId, nombre y puntaje son obligatorios'
      });
    }

    const [result] = await db.query(
      'INSERT INTO niveles (concurso_id, nombre, puntaje, descripcion, criterio_id) VALUES (?, ?, ?, ?, ?)',
      [concursoId, nombre.trim(), puntaje, descripcion || null, criterioId || null]
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Nivel creado correctamente',
      data: {
        id: result.insertId,
        concursoId,
        nombre: nombre.trim(),
        puntaje,
        descripcion: descripcion || null,
        criterioId: criterioId || null
      }
    });

  } catch (error) {
    console.error('ERROR create nivel:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear nivel' });
  }
};

// PUT /api/niveles/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, puntaje, descripcion } = req.body;

    if (!nombre || puntaje == null) {
      return res.status(400).json({ ok: false, mensaje: 'nombre y puntaje son obligatorios' });
    }

    const [result] = await db.query(
      'UPDATE niveles SET nombre = ?, puntaje = ?, descripcion = ? WHERE id = ?',
      [nombre.trim(), puntaje, descripcion || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Nivel no encontrado' });
    }

    return res.json({ ok: true, mensaje: 'Nivel actualizado correctamente' });

  } catch (error) {
    console.error('ERROR update nivel:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar nivel' });
  }
};

// DELETE /api/niveles/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const [usado] = await db.query(
      'SELECT COUNT(*) AS total FROM detalles_evaluacion WHERE nivel_id = ?',
      [id]
    );

    if (usado[0].total > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: 'No se puede eliminar: este nivel ya fue usado en evaluaciones'
      });
    }

    const [result] = await db.query('DELETE FROM niveles WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Nivel no encontrado' });
    }

    return res.json({ ok: true, mensaje: 'Nivel eliminado correctamente' });

  } catch (error) {
    console.error('ERROR delete nivel:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar nivel' });
  }
};