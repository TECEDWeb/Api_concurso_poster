const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { concursoId } = req.query;

    let query = 'SELECT * FROM secciones';
    const params = [];

    if (concursoId) {
      query += ' WHERE concurso_id = ?';
      params.push(concursoId);
    }

    query += ' ORDER BY orden ASC';

    const [rows] = await db.query(query, params);

    return res.json({ ok: true, data: rows || [] });

  } catch (error) {
    console.error('ERROR getAll secciones:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener secciones' });
  }
};

// POST /api/secciones
exports.create = async (req, res) => {
  try {
    const { concursoId, nombre, descripcion } = req.body;

    if (!concursoId || !nombre) {
      return res.status(400).json({
        ok: false,
        mensaje: 'concursoId y nombre son obligatorios'
      });
    }

    // Calcular el siguiente orden dentro de este concurso
    const [maxOrden] = await db.query(
      'SELECT COALESCE(MAX(orden), 0) AS maxOrden FROM secciones WHERE concurso_id = ?',
      [concursoId]
    );
    const nuevoOrden = maxOrden[0].maxOrden + 1;

    const [result] = await db.query(
      'INSERT INTO secciones (concurso_id, nombre, orden, descripcion) VALUES (?, ?, ?, ?)',
      [concursoId, nombre.trim(), nuevoOrden, descripcion || null]
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Sección creada correctamente',
      data: {
        id: result.insertId,
        concursoId,
        nombre: nombre.trim(),
        orden: nuevoOrden,
        descripcion: descripcion || null
      }
    });

  } catch (error) {
    console.error('ERROR create seccion:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear sección' });
  }
};

// PUT /api/secciones/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, orden } = req.body;

    if (!nombre) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio' });
    }

    const [result] = await db.query(
      'UPDATE secciones SET nombre = ?, descripcion = ?, orden = COALESCE(?, orden) WHERE id = ?',
      [nombre.trim(), descripcion || null, orden ?? null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Sección no encontrada' });
    }

    return res.json({ ok: true, mensaje: 'Sección actualizada correctamente' });

  } catch (error) {
    console.error('ERROR update seccion:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar sección' });
  }
};

// PUT /api/secciones/reordenar (reordenar varias a la vez, útil para drag & drop)
exports.reordenar = async (req, res) => {
  try {
    const { orden } = req.body; // [{ id, orden }, ...]

    if (!Array.isArray(orden)) {
      return res.status(400).json({ ok: false, mensaje: 'Formato de orden inválido' });
    }

    for (const item of orden) {
      await db.query('UPDATE secciones SET orden = ? WHERE id = ?', [item.orden, item.id]);
    }

    return res.json({ ok: true, mensaje: 'Orden actualizado' });

  } catch (error) {
    console.error('ERROR reordenar secciones:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al reordenar secciones' });
  }
};

// DELETE /api/secciones/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si tiene criterios asociados (evita huérfanos silenciosos)
    const [criterios] = await db.query(
      'SELECT COUNT(*) AS total FROM criterios WHERE seccion_id = ?',
      [id]
    );

    if (criterios[0].total > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: `No se puede eliminar: la sección tiene ${criterios[0].total} criterio(s) asociado(s). Elimínalos primero.`
      });
    }

    const [result] = await db.query('DELETE FROM secciones WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Sección no encontrada' });
    }

    return res.json({ ok: true, mensaje: 'Sección eliminada correctamente' });

  } catch (error) {
    console.error('ERROR delete seccion:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar sección' });
  }
};