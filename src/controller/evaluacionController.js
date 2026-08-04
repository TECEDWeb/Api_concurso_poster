const EvaluacionService = require('../services/evaluacionService');
const LogsService = require('../services/logsService');
const db = require('../config/db');

const evaluacionController = {

  async getAll(req, res) {
    try {
      const data = await EvaluacionService.getTodosResultados();
      return res.json({ ok: true, data });
    } catch (err) {
      console.error("ERROR getAll:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener evaluaciones"
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query(
        `SELECT e.*, p.nombre as proyecto_nombre, u.nombre as evaluador_nombre
         FROM evaluaciones e
         JOIN proyectos p ON e.proyecto_id = p.id
         JOIN usuarios u ON e.evaluador_id = u.id
         WHERE e.id = ?`,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Evaluación no encontrada'
        });
      }

      return res.json({ ok: true, data: rows[0] });
    } catch (err) {
      console.error("ERROR getById:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener la evaluación"
      });
    }
  },

  async create(req, res) {
    try {
      const { proyecto_id, evaluador_id, rubrica_id } = req.body;

      if (!proyecto_id || !evaluador_id || !rubrica_id) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Faltan campos requeridos'
        });
      }

      // Obtener nombres para el log
      let proyectoNombre = 'Proyecto';
      let evaluadorNombre = 'Evaluador';
      try {
        const [proyecto] = await db.query(
          `SELECT nombre FROM proyectos WHERE id = ?`,
          [proyecto_id]
        );
        if (proyecto.length > 0) proyectoNombre = proyecto[0].nombre;

        const [evaluador] = await db.query(
          `SELECT nombre FROM usuarios WHERE id = ?`,
          [evaluador_id]
        );
        if (evaluador.length > 0) evaluadorNombre = evaluador[0].nombre;
      } catch (logError) {
        console.error("Error obteniendo nombres para log:", logError);
      }

      const [result] = await db.query(
        `INSERT INTO evaluaciones (proyecto_id, evaluador_id, rubrica_id, estado, fecha_asignacion)
         VALUES (?, ?, ?, 'asignado', NOW())`,
        [proyecto_id, evaluador_id, rubrica_id]
      );

      // ✅ LOG: Evaluación creada
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'evaluacion',
          accion: 'crear',
          entidad_id: result.insertId,
          entidad_nombre: `Evaluación: ${proyectoNombre} → ${evaluadorNombre}`,
          descripcion: `Se creó la evaluación del proyecto "${proyectoNombre}" para el evaluador "${evaluadorNombre}"`,
          detalles: { proyecto_id, evaluador_id, rubrica_id },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.status(201).json({
        ok: true,
        mensaje: 'Evaluación creada correctamente',
        data: { id: result.insertId }
      });
    } catch (err) {
      console.error("ERROR create:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al crear la evaluación"
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { proyecto_id, evaluador_id, rubrica_id, estado } = req.body;

      // Obtener datos anteriores para el log
      let evaluacionAntes = null;
      try {
        const [evaluacion] = await db.query(
          `SELECT e.*, p.nombre as proyecto_nombre, u.nombre as evaluador_nombre
           FROM evaluaciones e
           JOIN proyectos p ON e.proyecto_id = p.id
           JOIN usuarios u ON e.evaluador_id = u.id
           WHERE e.id = ?`,
          [id]
        );
        if (evaluacion.length > 0) {
          evaluacionAntes = evaluacion[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos para log:", logError);
      }

      const [existing] = await db.query(
        `SELECT id FROM evaluaciones WHERE id = ?`,
        [id]
      );

      if (!existing.length) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Evaluación no encontrada'
        });
      }

      await db.query(
        `UPDATE evaluaciones 
         SET proyecto_id = ?, evaluador_id = ?, rubrica_id = ?, estado = ?
         WHERE id = ?`,
        [proyecto_id, evaluador_id, rubrica_id, estado, id]
      );

      // ✅ LOG: Evaluación actualizada
      try {
        if (evaluacionAntes) {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'evaluacion',
            accion: 'editar',
            entidad_id: parseInt(id),
            entidad_nombre: `Evaluación: ${evaluacionAntes.proyecto_nombre} → ${evaluacionAntes.evaluador_nombre}`,
            descripcion: `Se actualizó la evaluación del proyecto "${evaluacionAntes.proyecto_nombre}"`,
            detalles: { 
              cambios: { 
                antes: { estado: evaluacionAntes.estado, rubrica_id: evaluacionAntes.rubrica_id }, 
                despues: { estado: estado, rubrica_id: rubrica_id } 
              } 
            },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json({
        ok: true,
        mensaje: 'Evaluación actualizada correctamente'
      });
    } catch (err) {
      console.error("ERROR update:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al actualizar la evaluación"
      });
    }
  },

  // ============================================
  // NUEVOS MÉTODOS PARA ADMIN
  // ============================================

  async getReporteAdmin(req, res) {
    try {
      const data = await EvaluacionService.getTodosResultados();
      return res.json({ ok: true, data });
    } catch (err) {
      console.error("ERROR reporte:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al generar reporte"
      });
    }
  },

  async getAsignados(req, res) {
    try {
      const evaluadorId = req.usuario.id;
      const data = await EvaluacionService.getAsignados(evaluadorId);
      return res.json({ ok: true, data });
    } catch (err) {
      console.error("ERROR asignados:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener proyectos asignados"
      });
    }
  },

  async getFormulario(req, res) {
    try {
      const evaluacionId = req.params.id;
      const result = await EvaluacionService.getFormulario(evaluacionId);

      if (result && result.ok === false) {
        return res.status(400).json({
          ok: false,
          mensaje: result.mensaje
        });
      }

      if (result && result.data) {
        return res.json({
          ok: true,
          data: result.data
        });
      }

      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontró el formulario'
      });
    } catch (err) {
      console.error("ERROR FORMULARIO:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener formulario: " + err.message
      });
    }
  },

  async guardar(req, res) {
    try {
      const evaluacionId = req.params.id;

      // Obtener datos de la evaluación para el log
      let evaluacionInfo = null;
      try {
        const [evaluacion] = await db.query(
          `SELECT e.*, p.nombre as proyecto_nombre 
           FROM evaluaciones e
           JOIN proyectos p ON e.proyecto_id = p.id
           WHERE e.id = ?`,
          [evaluacionId]
        );
        if (evaluacion.length > 0) {
          evaluacionInfo = evaluacion[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos para log:", logError);
      }

      await EvaluacionService.guardarEvaluacion({
        evaluacionId,
        observacion: req.body.observacion,
        detalles: req.body.detalles
      });

      // ✅ LOG: Evaluación guardada (borrador)
      try {
        if (evaluacionInfo) {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'evaluacion',
            accion: 'guardar',
            entidad_id: parseInt(evaluacionId),
            entidad_nombre: `Evaluación: ${evaluacionInfo.proyecto_nombre}`,
            descripcion: `Se guardó (borrador) la evaluación del proyecto "${evaluacionInfo.proyecto_nombre}"`,
            detalles: { evaluacionId, tieneObservacion: !!req.body.observacion, totalDetalles: req.body.detalles?.length || 0 },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json({
        ok: true,
        mensaje: "Evaluación guardada correctamente"
      });
    } catch (err) {
      console.error("ERROR guardar:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al guardar evaluación"
      });
    }
  },

  async getMisResultados(req, res) {
    try {
      const evaluadorId = req.usuario.id;
      const data = await EvaluacionService.getMisResultados(evaluadorId);
      return res.json({ ok: true, data });
    } catch (err) {
      console.error("ERROR resultados:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener resultados"
      });
    }
  },

  async getResumen(req, res) {
    try {
      const data = await EvaluacionService.getResumenEvaluador();
      return res.json({ ok: true, data });
    } catch (err) {
      console.error("ERROR resumen:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener resumen"
      });
    }
  },

  async asignar(req, res) {
    try {
      const { proyecto_id, evaluador_id, fecha_limite } = req.body;

      if (!proyecto_id || !evaluador_id) {
        return res.status(400).json({
          ok: false,
          mensaje: "Debe seleccionar un proyecto y un evaluador"
        });
      }

      // Obtener nombres para el log
      let proyectoNombre = 'Proyecto';
      let evaluadorNombre = 'Evaluador';
      try {
        const [proyecto] = await db.query(
          `SELECT nombre FROM proyectos WHERE id = ?`,
          [proyecto_id]
        );
        if (proyecto.length > 0) proyectoNombre = proyecto[0].nombre;

        const [evaluador] = await db.query(
          `SELECT nombre FROM usuarios WHERE id = ?`,
          [evaluador_id]
        );
        if (evaluador.length > 0) evaluadorNombre = evaluador[0].nombre;
      } catch (logError) {
        console.error("Error obteniendo nombres para log:", logError);
      }

      const result = await EvaluacionService.asignarProyecto(evaluador_id, proyecto_id);

      // ✅ LOG: Proyecto asignado (desde evaluacionController)
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'asignacion',
          accion: 'crear',
          entidad_id: result?.id || null,
          entidad_nombre: `Asignación: ${proyectoNombre} → ${evaluadorNombre}`,
          descripcion: `Se asignó el proyecto "${proyectoNombre}" al evaluador "${evaluadorNombre}" (desde evaluación)`,
          detalles: { proyecto_id, evaluador_id, fecha_limite },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json({
        ok: true,
        mensaje: "Proyecto asignado correctamente",
        data: result
      });
    } catch (err) {
      console.error("ERROR asignar:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al asignar proyecto"
      });
    }
  },

  async getEvaluacionParaEditar(req, res) {
    try {
      const evaluacionId = req.params.id;
      const evaluadorId = req.usuario.id;

      const [evaluacion] = await db.query(
        `SELECT evaluador_id, estado FROM evaluaciones WHERE id = ?`,
        [evaluacionId]
      );

      if (!evaluacion.length) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Evaluación no encontrada'
        });
      }

      if (evaluacion[0].evaluador_id !== evaluadorId) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tienes permisos para editar esta evaluación'
        });
      }

      const result = await EvaluacionService.getDetalleEvaluacionParaEdicion(evaluacionId);
      return res.json(result);
    } catch (err) {
      console.error("ERROR getEvaluacionParaEditar:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al obtener detalles de la evaluación"
      });
    }
  },

  async actualizarEvaluacion(req, res) {
    try {
      const evaluacionId = req.params.id;
      const evaluadorId = req.usuario.id;

      // Obtener datos de la evaluación para el log
      let evaluacionInfo = null;
      try {
        const [evaluacion] = await db.query(
          `SELECT e.*, p.nombre as proyecto_nombre 
           FROM evaluaciones e
           JOIN proyectos p ON e.proyecto_id = p.id
           WHERE e.id = ?`,
          [evaluacionId]
        );
        if (evaluacion.length > 0) {
          evaluacionInfo = evaluacion[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos para log:", logError);
      }

      const [evaluacion] = await db.query(
        `SELECT evaluador_id, estado FROM evaluaciones WHERE id = ?`,
        [evaluacionId]
      );

      if (!evaluacion.length) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Evaluación no encontrada'
        });
      }

      if (evaluacion[0].evaluador_id !== evaluadorId) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tienes permisos para editar esta evaluación'
        });
      }

      if (evaluacion[0].estado === 'evaluado') {
        return res.status(400).json({
          ok: false,
          mensaje: 'Esta evaluación ya fue finalizada y no puede ser editada'
        });
      }

      const result = await EvaluacionService.actualizarEvaluacion({
        evaluacionId,
        observacion: req.body.observacion,
        detalles: req.body.detalles
      });

      // ✅ LOG: Evaluación actualizada (desde evaluador)
      try {
        if (evaluacionInfo) {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'evaluacion',
            accion: 'editar',
            entidad_id: parseInt(evaluacionId),
            entidad_nombre: `Evaluación: ${evaluacionInfo.proyecto_nombre}`,
            descripcion: `El evaluador actualizó la evaluación del proyecto "${evaluacionInfo.proyecto_nombre}"`,
            detalles: { evaluacionId, tieneObservacion: !!req.body.observacion, totalDetalles: req.body.detalles?.length || 0 },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json(result);
    } catch (err) {
      console.error("ERROR actualizarEvaluacion:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al actualizar la evaluación"
      });
    }
  },

  async finalizarEvaluacion(req, res) {
    try {
      const evaluacionId = req.params.id;
      const evaluadorId = req.usuario.id;

      // Obtener datos de la evaluación para el log
      let evaluacionInfo = null;
      try {
        const [evaluacion] = await db.query(
          `SELECT e.*, p.nombre as proyecto_nombre 
           FROM evaluaciones e
           JOIN proyectos p ON e.proyecto_id = p.id
           WHERE e.id = ?`,
          [evaluacionId]
        );
        if (evaluacion.length > 0) {
          evaluacionInfo = evaluacion[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos para log:", logError);
      }

      const [evaluacion] = await db.query(
        `SELECT evaluador_id, estado FROM evaluaciones WHERE id = ?`,
        [evaluacionId]
      );

      if (!evaluacion.length) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Evaluación no encontrada'
        });
      }

      if (evaluacion[0].evaluador_id !== evaluadorId) {
        return res.status(403).json({
          ok: false,
          mensaje: 'No tienes permisos para finalizar esta evaluación'
        });
      }

      if (evaluacion[0].estado === 'evaluado') {
        return res.status(400).json({
          ok: false,
          mensaje: 'Esta evaluación ya fue finalizada'
        });
      }

      const result = await EvaluacionService.finalizarEvaluacion(evaluacionId);

      // ✅ LOG: Evaluación finalizada
      try {
        if (evaluacionInfo) {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'evaluacion',
            accion: 'finalizar',
            entidad_id: parseInt(evaluacionId),
            entidad_nombre: `Evaluación: ${evaluacionInfo.proyecto_nombre}`,
            descripcion: `El evaluador finalizó la evaluación del proyecto "${evaluacionInfo.proyecto_nombre}"`,
            detalles: { evaluacionId, fecha_evaluacion: evaluacionInfo.fecha_evaluacion },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json(result);
    } catch (err) {
      console.error("ERROR finalizarEvaluacion:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al finalizar la evaluación"
      });
    }
  },

  async reabrirEvaluacion(req, res) {
    try {
      const evaluacionId = req.params.id;

      // Obtener datos de la evaluación para el log
      let evaluacionInfo = null;
      try {
        const [evaluacion] = await db.query(
          `SELECT e.*, p.nombre as proyecto_nombre 
           FROM evaluaciones e
           JOIN proyectos p ON e.proyecto_id = p.id
           WHERE e.id = ?`,
          [evaluacionId]
        );
        if (evaluacion.length > 0) {
          evaluacionInfo = evaluacion[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos para log:", logError);
      }

      const result = await EvaluacionService.reabrirEvaluacion(evaluacionId);

      // ✅ LOG: Evaluación reabierta
      try {
        if (evaluacionInfo) {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'evaluacion',
            accion: 'reabrir',
            entidad_id: parseInt(evaluacionId),
            entidad_nombre: `Evaluación: ${evaluacionInfo.proyecto_nombre}`,
            descripcion: `Se reabrió la evaluación del proyecto "${evaluacionInfo.proyecto_nombre}"`,
            detalles: { evaluacionId },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json(result);
    } catch (err) {
      console.error("ERROR reabrirEvaluacion:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al reabrir la evaluación"
      });
    }
  },

  async eliminarEvaluacion(req, res) {
    try {
      const evaluacionId = req.params.id;

      // Obtener datos de la evaluación para el log
      let evaluacionInfo = null;
      try {
        const [evaluacion] = await db.query(
          `SELECT e.*, p.nombre as proyecto_nombre 
           FROM evaluaciones e
           JOIN proyectos p ON e.proyecto_id = p.id
           WHERE e.id = ?`,
          [evaluacionId]
        );
        if (evaluacion.length > 0) {
          evaluacionInfo = evaluacion[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos para log:", logError);
      }

      const result = await EvaluacionService.eliminarEvaluacion(evaluacionId);

      // LOG: Evaluación eliminada
      try {
        if (evaluacionInfo) {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'evaluacion',
            accion: 'eliminar',
            entidad_id: parseInt(evaluacionId),
            entidad_nombre: `Evaluación: ${evaluacionInfo.proyecto_nombre}`,
            descripcion: `Se eliminó la evaluación del proyecto "${evaluacionInfo.proyecto_nombre}"`,
            detalles: { evaluacionId },
            req
          });
        } else {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'evaluacion',
            accion: 'eliminar',
            entidad_id: parseInt(evaluacionId),
            entidad_nombre: `Evaluación ID: ${evaluacionId}`,
            descripcion: `Se eliminó la evaluación ID ${evaluacionId}`,
            detalles: { evaluacionId },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json(result);
    } catch (err) {
      console.error("ERROR eliminarEvaluacion:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al eliminar la evaluación"
      });
    }
  },
  // controller/evaluacionController.js

// ... (código existente)

// ============ NUEVOS MÉTODOS PARA EDICIÓN DE RESPUESTAS ============

/**
 * Obtener evaluación con todos los detalles para edición (Admin)
 * GET /api/evaluaciones/:id/editar
 */
  async getEvaluacionParaEditar(req, res) {
    try {
      const evaluacionId = parseInt(req.params.id);

      if (isNaN(evaluacionId)) {
        return res.status(400).json({ 
          ok: false, 
          mensaje: 'ID de evaluación inválido' 
        });
      }

      // Obtener evaluación
      const [evaluacion] = await db.query(`
        SELECT 
          e.id,
          e.proyecto_id,
          e.evaluador_id,
          e.rubrica_id,
          e.estado,
          e.observaciones,
          e.fecha_evaluacion,
          e.created_at,
          e.updated_at,
          u.nombre as evaluador_nombre,
          u.email as evaluador_email,
          u.rol as evaluador_rol,
          p.nombre as proyecto_nombre,
          p.area as proyecto_area,
          p.nivel as proyecto_nivel,
          r.nombre as rubrica_nombre,
          r.descripcion as rubrica_descripcion,
          c.nombre as concurso_nombre,
          c.id as concurso_id
        FROM evaluaciones e
        JOIN usuarios u ON u.id = e.evaluador_id
        JOIN proyectos p ON p.id = e.proyecto_id
        JOIN rubricas r ON r.id = e.rubrica_id
        LEFT JOIN concursos c ON c.id = p.concurso_id
        WHERE e.id = ?
      `, [evaluacionId]);

      if (evaluacion.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          mensaje: 'Evaluación no encontrada' 
        });
      }

      // Obtener detalles de la evaluación
      const [detalles] = await db.query(`
        SELECT 
          id,
          evaluacion_id,
          criterio_id,
          nivel_id,
          puntaje,
          seccion,
          criterio,
          nivel,
          puntaje_maximo,
          created_at,
          updated_at
        FROM detalles_evaluacion 
        WHERE evaluacion_id = ?
        ORDER BY seccion, id
      `, [evaluacionId]);

      // Obtener criterios disponibles de la rúbrica
      const [criterios] = await db.query(`
        SELECT 
          c.id,
          c.nombre,
          c.descripcion,
          c.seccion,
          c.puntaje_maximo,
          c.orden
        FROM criterios c
        WHERE c.rubrica_id = ?
        ORDER BY c.seccion, c.orden
      `, [evaluacion[0].rubrica_id]);

      return res.json({
        ok: true,
        data: {
          evaluacion: evaluacion[0],
          detalles: detalles,
          criterios: criterios
        }
      });

    } catch (error) {
      console.error('ERROR GET EVALUACION PARA EDITAR:', error);
      return res.status(500).json({ 
        ok: false, 
        mensaje: 'Error al obtener evaluación: ' + error.message 
      });
    }
  },

  /**
   * ACTUALIZAR EVALUACIÓN (Admin)
   * PUT /api/evaluaciones/:id/actualizar
   */
  async actualizarEvaluacion(req, res) {
    let connection;
    try {
      const evaluacionId = parseInt(req.params.id);
      const { 
        observaciones, 
        detalles,
        estado,
        fecha_evaluacion 
      } = req.body;

      if (isNaN(evaluacionId)) {
        return res.status(400).json({ 
          ok: false, 
          mensaje: 'ID de evaluación inválido' 
        });
      }

      // Verificar que existe
      const [existing] = await db.query(`
        SELECT 
          e.*,
          u.nombre as evaluador_nombre,
          p.nombre as proyecto_nombre
        FROM evaluaciones e
        JOIN usuarios u ON u.id = e.evaluador_id
        JOIN proyectos p ON p.id = e.proyecto_id
        WHERE e.id = ?
      `, [evaluacionId]);

      if (existing.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          mensaje: 'Evaluación no encontrada' 
        });
      }

      // Obtener conexión para transacción
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Actualizar evaluación
      const updateFields = [];
      const updateValues = [];

      if (observaciones !== undefined) {
        updateFields.push('observaciones = ?');
        updateValues.push(observaciones || null);
      }

      if (estado !== undefined) {
        updateFields.push('estado = ?');
        updateValues.push(estado);
      }

      if (fecha_evaluacion !== undefined) {
        updateFields.push('fecha_evaluacion = ?');
        updateValues.push(fecha_evaluacion || null);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        const query = `
          UPDATE evaluaciones 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;
        updateValues.push(evaluacionId);
        await connection.query(query, updateValues);
      }

      // Actualizar detalles si se enviaron
      if (detalles && Array.isArray(detalles) && detalles.length > 0) {
        // Eliminar detalles existentes
        await connection.query(
          'DELETE FROM detalles_evaluacion WHERE evaluacion_id = ?',
          [evaluacionId]
        );

        // Insertar nuevos detalles
        for (const detalle of detalles) {
          const puntaje = parseFloat(detalle.puntaje) || 0;
          const puntajeMaximo = parseFloat(detalle.puntaje_maximo) || 100;
          
          await connection.query(`
            INSERT INTO detalles_evaluacion 
            (evaluacion_id, criterio_id, nivel_id, puntaje, seccion, criterio, nivel, puntaje_maximo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            evaluacionId,
            detalle.criterio_id || null,
            detalle.nivel_id || null,
            Math.min(puntaje, puntajeMaximo),
            detalle.seccion || 'General',
            detalle.criterio || 'Criterio sin nombre',
            detalle.nivel || 'Sin nivel',
            puntajeMaximo
          ]);
        }
      }

      await connection.commit();

      // Registrar log
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'evaluacion',
          accion: 'editar_respuestas',
          entidad_id: evaluacionId,
          entidad_nombre: `Evaluación #${evaluacionId} - ${existing[0].proyecto_nombre}`,
          descripcion: `Se editaron las respuestas de la evaluación del proyecto "${existing[0].proyecto_nombre}"`,
          detalles: { 
            evaluador: existing[0].evaluador_nombre,
            observaciones_actualizadas: observaciones !== undefined,
            total_detalles: detalles?.length || 0,
            estado: estado || existing[0].estado
          },
          req
        });
      } catch (logError) {
        console.error('Error registrando log:', logError);
      }

      // Obtener evaluación actualizada
      const [evaluacionActualizada] = await db.query(`
        SELECT 
          e.*,
          u.nombre as evaluador_nombre,
          p.nombre as proyecto_nombre,
          r.nombre as rubrica_nombre,
          c.nombre as concurso_nombre
        FROM evaluaciones e
        JOIN usuarios u ON u.id = e.evaluador_id
        JOIN proyectos p ON p.id = e.proyecto_id
        JOIN rubricas r ON r.id = e.rubrica_id
        LEFT JOIN concursos c ON c.id = p.concurso_id
        WHERE e.id = ?
      `, [evaluacionId]);

      return res.json({ 
        ok: true, 
        mensaje: 'Evaluación actualizada correctamente',
        data: evaluacionActualizada[0]
      });

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('ERROR UPDATE EVALUACION:', error);
      return res.status(500).json({ 
        ok: false, 
        mensaje: 'Error al actualizar evaluación: ' + error.message 
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  /**
   * FINALIZAR EVALUACIÓN (Evaluador)
   * POST /api/evaluaciones/:id/finalizar
   */
  async finalizarEvaluacion(req, res) {
    try {
      const evaluacionId = parseInt(req.params.id);
      const evaluadorId = req.usuario.id;

      const [evaluacion] = await db.query(`
        SELECT * FROM evaluaciones 
        WHERE id = ? AND evaluador_id = ?
      `, [evaluacionId, evaluadorId]);

      if (evaluacion.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          mensaje: 'Evaluación no encontrada o no asignada a este evaluador' 
        });
      }

      if (evaluacion[0].estado === 'evaluado') {
        return res.status(400).json({ 
          ok: false, 
          mensaje: 'La evaluación ya está finalizada' 
        });
      }

      await db.query(`
        UPDATE evaluaciones 
        SET estado = 'evaluado', 
            fecha_evaluacion = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `, [evaluacionId]);

      // Registrar log
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'evaluacion',
          accion: 'finalizar',
          entidad_id: evaluacionId,
          entidad_nombre: `Evaluación #${evaluacionId}`,
          descripcion: `El evaluador finalizó la evaluación #${evaluacionId}`,
          req
        });
      } catch (logError) {
        console.error('Error registrando log:', logError);
      }

      return res.json({ 
        ok: true, 
        mensaje: 'Evaluación finalizada correctamente' 
      });

    } catch (error) {
      console.error('ERROR FINALIZAR EVALUACION:', error);
      return res.status(500).json({ 
        ok: false, 
        mensaje: 'Error al finalizar evaluación: ' + error.message 
      });
    }
  },

  /**
   * REABRIR EVALUACIÓN (Admin)
   * PUT /api/evaluaciones/:id/reabrir
   */
  async reabrirEvaluacion(req, res) {
    try {
      const evaluacionId = parseInt(req.params.id);

      const [evaluacion] = await db.query(`
        SELECT e.*, p.nombre as proyecto_nombre 
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        WHERE e.id = ?
      `, [evaluacionId]);

      if (evaluacion.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          mensaje: 'Evaluación no encontrada' 
        });
      }

      await db.query(`
        UPDATE evaluaciones 
        SET estado = 'asignado', 
            fecha_evaluacion = NULL,
            updated_at = NOW() 
        WHERE id = ?
      `, [evaluacionId]);

      // Registrar log
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'evaluacion',
          accion: 'reabrir',
          entidad_id: evaluacionId,
          entidad_nombre: `Evaluación #${evaluacionId} - ${evaluacion[0].proyecto_nombre}`,
          descripcion: `Se reabrió la evaluación del proyecto "${evaluacion[0].proyecto_nombre}"`,
          req
        });
      } catch (logError) {
        console.error('Error registrando log:', logError);
      }

      return res.json({ 
        ok: true, 
        mensaje: 'Evaluación reabierta correctamente' 
      });

    } catch (error) {
      console.error('ERROR REABRIR EVALUACION:', error);
      return res.status(500).json({ 
        ok: false, 
        mensaje: 'Error al reabrir evaluación: ' + error.message 
      });
    }
  },

  /**
   * ELIMINAR EVALUACIÓN (Admin)
   * DELETE /api/evaluaciones/:id
   */
  async eliminarEvaluacion(req, res) {
    try {
      const evaluacionId = parseInt(req.params.id);

      const [evaluacion] = await db.query(`
        SELECT e.*, p.nombre as proyecto_nombre 
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        WHERE e.id = ?
      `, [evaluacionId]);

      if (evaluacion.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          mensaje: 'Evaluación no encontrada' 
        });
      }

      // Eliminar detalles primero
      await db.query(
        'DELETE FROM detalles_evaluacion WHERE evaluacion_id = ?',
        [evaluacionId]
      );

      // Eliminar evaluación
      await db.query(
        'DELETE FROM evaluaciones WHERE id = ?',
        [evaluacionId]
      );

      // Registrar log
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'evaluacion',
          accion: 'eliminar',
          entidad_id: evaluacionId,
          entidad_nombre: `Evaluación #${evaluacionId} - ${evaluacion[0].proyecto_nombre}`,
          descripcion: `Se eliminó la evaluación del proyecto "${evaluacion[0].proyecto_nombre}"`,
          req
        });
      } catch (logError) {
        console.error('Error registrando log:', logError);
      }

      return res.json({ 
        ok: true, 
        mensaje: 'Evaluación eliminada correctamente' 
      });

    } catch (error) {
      console.error('ERROR ELIMINAR EVALUACION:', error);
      return res.status(500).json({ 
        ok: false, 
        mensaje: 'Error al eliminar evaluación: ' + error.message 
      });
    }
  }

};

module.exports = evaluacionController;