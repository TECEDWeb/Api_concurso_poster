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

      // ✅ LOG: Evaluación eliminada
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
  }
};

module.exports = evaluacionController;