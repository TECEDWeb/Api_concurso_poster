const db = require('../config/db');
const LogsService = require('../services/logsService');

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

    // Obtener nombre del concurso o criterio para el log
    let entidadNombre = '';
    let tipoEntidad = 'concurso';
    try {
      if (criterioId) {
        const [criterio] = await db.query(
          'SELECT texto FROM criterios WHERE id = ?',
          [criterioId]
        );
        if (criterio.length > 0) {
          entidadNombre = criterio[0].texto.substring(0, 30);
          tipoEntidad = 'criterio';
        }
      } else {
        const [concurso] = await db.query(
          'SELECT nombre FROM concursos WHERE id = ?',
          [concursoId]
        );
        if (concurso.length > 0) {
          entidadNombre = concurso[0].nombre;
        }
      }
    } catch (logError) {
      console.error("Error obteniendo nombre para log:", logError);
    }

    const [result] = await db.query(
      'INSERT INTO niveles (concurso_id, nombre, puntaje, descripcion, criterio_id) VALUES (?, ?, ?, ?, ?)',
      [concursoId, nombre.trim(), puntaje, descripcion || null, criterioId || null]
    );

    // ✅ LOG: Nivel creado
    try {
      const descripcionLog = criterioId 
        ? `Se creó el nivel "${nombre.trim()}" para el criterio "${entidadNombre}"`
        : `Se creó el nivel "${nombre.trim()}" en la escala global del concurso "${entidadNombre}"`;
      
      await LogsService.registrarActividad({
        usuario: req.usuario,
        tipo: 'nivel',
        accion: 'crear',
        entidad_id: result.insertId,
        entidad_nombre: `Nivel: ${nombre.trim()}`,
        descripcion: descripcionLog,
        detalles: { concursoId, nombre: nombre.trim(), puntaje, criterioId: criterioId || null },
        req
      });
    } catch (logError) {
      console.error("Error registrando log:", logError);
      // No interrumpimos el flujo si falla el log
    }

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

    // Obtener datos del nivel antes de actualizar (para el log)
    let nivelAntes = null;
    try {
      const [nivel] = await db.query(
        'SELECT nombre, puntaje, concurso_id, criterio_id FROM niveles WHERE id = ?',
        [id]
      );
      if (nivel.length > 0) {
        nivelAntes = nivel[0];
      }
    } catch (logError) {
      console.error("Error obteniendo datos del nivel:", logError);
    }

    const [result] = await db.query(
      'UPDATE niveles SET nombre = ?, puntaje = ?, descripcion = ? WHERE id = ?',
      [nombre.trim(), puntaje, descripcion || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Nivel no encontrado' });
    }

    // ✅ LOG: Nivel actualizado
    try {
      if (nivelAntes) {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'nivel',
          accion: 'editar',
          entidad_id: parseInt(id),
          entidad_nombre: `Nivel: ${nombre.trim()}`,
          descripcion: `Se actualizó el nivel de "${nivelAntes.nombre}" (${nivelAntes.puntaje} pts) a "${nombre.trim()}" (${puntaje} pts)`,
          detalles: { 
            cambios: { 
              antes: { nombre: nivelAntes.nombre, puntaje: nivelAntes.puntaje }, 
              despues: { nombre: nombre.trim(), puntaje: puntaje } 
            } 
          },
          req
        });
      }
    } catch (logError) {
      console.error("Error registrando log:", logError);
      // No interrumpimos el flujo si falla el log
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

    // Obtener datos del nivel antes de eliminar (para el log)
    let nivelInfo = null;
    try {
      const [nivel] = await db.query(
        'SELECT nombre, puntaje, concurso_id, criterio_id FROM niveles WHERE id = ?',
        [id]
      );
      if (nivel.length > 0) {
        nivelInfo = nivel[0];
      }
    } catch (logError) {
      console.error("Error obteniendo datos del nivel:", logError);
    }

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

    // ✅ LOG: Nivel eliminado
    try {
      if (nivelInfo) {
        const tipoNivel = nivelInfo.criterio_id ? 'criterio' : 'concurso';
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'nivel',
          accion: 'eliminar',
          entidad_id: parseInt(id),
          entidad_nombre: `Nivel: ${nivelInfo.nombre}`,
          descripcion: `Se eliminó el nivel "${nivelInfo.nombre}" (${nivelInfo.puntaje} pts) del ${tipoNivel}`,
          detalles: { id, concursoId: nivelInfo.concurso_id, criterioId: nivelInfo.criterio_id },
          req
        });
      } else {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'nivel',
          accion: 'eliminar',
          entidad_id: parseInt(id),
          entidad_nombre: `Nivel ID: ${id}`,
          descripcion: `Se eliminó el nivel ID ${id}`,
          detalles: { id },
          req
        });
      }
    } catch (logError) {
      console.error("Error registrando log:", logError);
      // No interrumpimos el flujo si falla el log
    }

    return res.json({ ok: true, mensaje: 'Nivel eliminado correctamente' });

  } catch (error) {
    console.error('ERROR delete nivel:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar nivel' });
  }
};