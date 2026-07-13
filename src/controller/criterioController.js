const db = require('../config/db');

// GET /api/criterios?seccionId=12
exports.getAll = async (req, res) => {
  try {
    const { seccionId } = req.query;

    let query = 'SELECT * FROM criterios';
    const params = [];

    if (seccionId) {
      query += ' WHERE seccion_id = ?';
      params.push(seccionId);
    }

    query += ' ORDER BY orden ASC';

    const [rows] = await db.query(query, params);

    return res.json({ ok: true, data: rows || [] });

  } catch (error) {
    console.error('ERROR getAll criterios:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener criterios' });
  }
};

// POST /api/criterios
exports.create = async (req, res) => {
  try {
    const { seccionId, texto, rubricaId } = req.body;

    if (!seccionId || !texto) {
      return res.status(400).json({
        ok: false,
        mensaje: 'seccionId y texto son obligatorios'
      });
    }

    const [maxOrden] = await db.query(
      'SELECT COALESCE(MAX(orden), 0) AS maxOrden FROM criterios WHERE seccion_id = ?',
      [seccionId]
    );
    const nuevoOrden = maxOrden[0].maxOrden + 1;

    const [result] = await db.query(
      'INSERT INTO criterios (seccion_id, texto, orden, rubrica_id) VALUES (?, ?, ?, ?)',
      [seccionId, texto.trim(), nuevoOrden, rubricaId || null]
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Criterio creado correctamente',
      data: {
        id: result.insertId,
        seccionId,
        texto: texto.trim(),
        orden: nuevoOrden,
        rubricaId: rubricaId || null
      }
    });

  } catch (error) {
    console.error('ERROR create criterio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear criterio' });
  }
};

// PUT /api/criterios/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto, orden } = req.body;

    if (!texto) {
      return res.status(400).json({ ok: false, mensaje: 'El texto es obligatorio' });
    }

    const [result] = await db.query(
      'UPDATE criterios SET texto = ?, orden = COALESCE(?, orden) WHERE id = ?',
      [texto.trim(), orden ?? null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Criterio no encontrado' });
    }

    return res.json({ ok: true, mensaje: 'Criterio actualizado correctamente' });

  } catch (error) {
    console.error('ERROR update criterio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar criterio' });
  }
};

// DELETE /api/criterios/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si ya se usó en alguna evaluación (proteger integridad histórica)
    const [usado] = await db.query(
      'SELECT COUNT(*) AS total FROM detalles_evaluacion WHERE criterio_id = ?',
      [id]
    );

    if (usado[0].total > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: 'No se puede eliminar: este criterio ya tiene evaluaciones registradas'
      });
    }

    // Eliminar niveles propios del criterio primero (si tiene overrides)
    await db.query('DELETE FROM niveles WHERE criterio_id = ?', [id]);

    const [result] = await db.query('DELETE FROM criterios WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Criterio no encontrado' });
    }

    return res.json({ ok: true, mensaje: 'Criterio eliminado correctamente' });

  } catch (error) {
    console.error('ERROR delete criterio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar criterio' });
  }
};