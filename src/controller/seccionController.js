const db = require('../config/db');
const LogsService = require('../services/logsService');

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

    // Obtener nombre del concurso para el log
    let nombreConcurso = 'Concurso';
    try {
      const [concurso] = await db.query(
        'SELECT nombre FROM concursos WHERE id = ?',
        [concursoId]
      );
      if (concurso.length > 0) {
        nombreConcurso = concurso[0].nombre;
      }
    } catch (logError) {
      console.error("Error obteniendo nombre del concurso:", logError);
    }

    const [maxOrden] = await db.query(
      'SELECT COALESCE(MAX(orden), 0) AS maxOrden FROM secciones WHERE concurso_id = ?',
      [concursoId]
    );
    const nuevoOrden = maxOrden[0].maxOrden + 1;

    const [result] = await db.query(
      'INSERT INTO secciones (concurso_id, nombre, orden, descripcion) VALUES (?, ?, ?, ?)',
      [concursoId, nombre.trim(), nuevoOrden, descripcion || null]
    );

    // ✅ LOG: Sección creada
    try {
      await LogsService.registrarActividad({
        usuario: req.usuario,
        tipo: 'seccion',
        accion: 'crear',
        entidad_id: result.insertId,
        entidad_nombre: nombre.trim(),
        descripcion: `Se creó la sección "${nombre.trim()}" en el concurso "${nombreConcurso}"`,
        detalles: { concursoId, orden: nuevoOrden },
        req
      });
    } catch (logError) {
      console.error("Error registrando log:", logError);
      // No interrumpimos el flujo si falla el log
    }

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

    // Obtener datos de la sección antes de actualizar (para el log)
    let seccionAntes = null;
    try {
      const [seccion] = await db.query(
        'SELECT * FROM secciones WHERE id = ?',
        [id]
      );
      if (seccion.length > 0) {
        seccionAntes = seccion[0];
      }
    } catch (logError) {
      console.error("Error obteniendo datos de la sección:", logError);
    }

    const [result] = await db.query(
      'UPDATE secciones SET nombre = ?, descripcion = ?, orden = COALESCE(?, orden) WHERE id = ?',
      [nombre.trim(), descripcion || null, orden ?? null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Sección no encontrada' });
    }

    // ✅ LOG: Sección actualizada
    try {
      if (seccionAntes) {
        let cambios = [];
        if (nombre.trim() !== seccionAntes.nombre) cambios.push(`nombre: "${seccionAntes.nombre}" → "${nombre.trim()}"`);
        if (descripcion !== seccionAntes.descripcion) cambios.push('descripción actualizada');
        if (orden !== null && orden !== seccionAntes.orden) cambios.push(`orden: ${seccionAntes.orden} → ${orden}`);

        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'seccion',
          accion: 'editar',
          entidad_id: parseInt(id),
          entidad_nombre: nombre.trim(),
          descripcion: `Se actualizó la sección "${nombre.trim()}"${cambios.length > 0 ? ': ' + cambios.join(', ') : ''}`,
          detalles: { 
            cambios: { 
              antes: { nombre: seccionAntes.nombre, descripcion: seccionAntes.descripcion, orden: seccionAntes.orden }, 
              despues: { nombre: nombre.trim(), descripcion: descripcion || null, orden: orden ?? seccionAntes.orden } 
            } 
          },
          req
        });
      }
    } catch (logError) {
      console.error("Error registrando log:", logError);
      // No interrumpimos el flujo si falla el log
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

    // Obtener nombres de las secciones para el log
    let seccionesInfo = [];
    try {
      const ids = orden.map(item => item.id);
      const [secciones] = await db.query(
        'SELECT id, nombre FROM secciones WHERE id IN (?)',
        [ids]
      );
      seccionesInfo = secciones;
    } catch (logError) {
      console.error("Error obteniendo nombres de secciones:", logError);
    }

    for (const item of orden) {
      await db.query('UPDATE secciones SET orden = ? WHERE id = ?', [item.orden, item.id]);
    }

    // ✅ LOG: Secciones reordenadas
    try {
      const nombres = seccionesInfo.map(s => s.nombre).join(', ');
      await LogsService.registrarActividad({
        usuario: req.usuario,
        tipo: 'seccion',
        accion: 'reordenar',
        entidad_id: null,
        entidad_nombre: 'Secciones reordenadas',
        descripcion: `Se reordenaron ${orden.length} secciones: ${nombres.substring(0, 100)}${nombres.length > 100 ? '...' : ''}`,
        detalles: { totalSecciones: orden.length, orden },
        req
      });
    } catch (logError) {
      console.error("Error registrando log:", logError);
      // No interrumpimos el flujo si falla el log
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

    // Obtener datos de la sección antes de eliminar (para el log)
    let seccionInfo = null;
    try {
      const [seccion] = await db.query(
        'SELECT nombre, concurso_id FROM secciones WHERE id = ?',
        [id]
      );
      if (seccion.length > 0) {
        seccionInfo = seccion[0];
      }
    } catch (logError) {
      console.error("Error obteniendo datos de la sección:", logError);
    }

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

    // ✅ LOG: Sección eliminada
    try {
      if (seccionInfo) {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'seccion',
          accion: 'eliminar',
          entidad_id: parseInt(id),
          entidad_nombre: seccionInfo.nombre,
          descripcion: `Se eliminó la sección "${seccionInfo.nombre}"`,
          detalles: { id, concursoId: seccionInfo.concurso_id },
          req
        });
      } else {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'seccion',
          accion: 'eliminar',
          entidad_id: parseInt(id),
          entidad_nombre: `Sección ID: ${id}`,
          descripcion: `Se eliminó la sección ID ${id}`,
          detalles: { id },
          req
        });
      }
    } catch (logError) {
      console.error("Error registrando log:", logError);
      // No interrumpimos el flujo si falla el log
    }

    return res.json({ ok: true, mensaje: 'Sección eliminada correctamente' });

  } catch (error) {
    console.error('ERROR delete seccion:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar sección' });
  }
};