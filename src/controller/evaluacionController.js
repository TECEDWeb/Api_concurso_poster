const EvaluacionService = require('../services/evaluacionService');
const db = require('../config/db');

const evaluacionController = {

  /**
   * GET /api/evaluaciones
   */
  async getAll(req, res) {
    try {
      const data = await EvaluacionService.getTodosResultados();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error("ERROR getAll:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener evaluaciones"
      });
    }
  },

  /**
   * GET /api/evaluaciones/reporte-admin
   */
  async getReporteAdmin(req, res) {
    try {
      const data = await EvaluacionService.getTodosResultados();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error("ERROR reporte:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al generar reporte"
      });
    }
  },

  /**
   * GET /api/evaluaciones/asignados
   */
  async getAsignados(req, res) {
    try {
      const evaluadorId = req.usuario.id;

      const data = await EvaluacionService.getAsignados(evaluadorId);

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error("ERROR asignados:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener proyectos asignados"
      });
    }
  },

  /**
   * GET /api/evaluaciones/:id/formulario
   */
  async getFormulario(req, res) {
    try {
      console.log("=================================");
      console.log("📥 SOLICITUD FORMULARIO");
      console.log("ID RECIBIDO:", req.params.id);
      console.log("USUARIO:", req.usuario);
      console.log("=================================");

      const evaluacionId = req.params.id;

      const result = await EvaluacionService.getFormulario(evaluacionId);

      console.log("📤 RESPUESTA FORMULARIO:");
      console.log(JSON.stringify(result, null, 2));

      // Si el servicio devuelve { ok: false, mensaje: ... }
      if (result && result.ok === false) {
        return res.status(400).json({
          ok: false,
          mensaje: result.mensaje
        });
      }

      // Si el servicio devuelve data directamente
      if (result && result.data) {
        return res.json({
          ok: true,
          data: result.data  // ← Importante: enviar data directamente
        });
      }

      // Si no hay data
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontró el formulario'
      });

    } catch (err) {
      console.error("❌ ERROR FORMULARIO:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener formulario: " + err.message
      });
    }
  },
  /**
   * POST /api/evaluaciones/:id/guardar
   */
  async guardar(req, res) {
    try {
      const evaluacionId = req.params.id;

      await EvaluacionService.guardarEvaluacion({
        evaluacionId,
        observacion: req.body.observacion,
        detalles: req.body.detalles
      });

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

  /**
   * GET /api/evaluaciones/mis-resultados
   */
  async getMisResultados(req, res) {
    try {
      const evaluadorId = req.usuario.id;

      const data = await EvaluacionService.getMisResultados(evaluadorId);

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error("ERROR resultados:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener resultados"
      });
    }
  },

  /**
   * GET /api/evaluaciones/resumen
   */
  async getResumen(req, res) {
    try {
      const data = await EvaluacionService.getResumenEvaluador();

      return res.json({
        ok: true,
        data
      });

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

      const { proyectoId, evaluadores } = req.body;

      // Validación
      if (
        !proyectoId ||
        !Array.isArray(evaluadores) ||
        evaluadores.length === 0
      ) {
        return res.status(400).json({
          ok: false,
          mensaje: "Debe seleccionar un proyecto y al menos un evaluador."
        });
      }

      await EvaluacionService.asignarMasivo(
        proyectoId,
        evaluadores
      );

      return res.json({
        ok: true,
        mensaje: "Proyecto asignado correctamente."
      });

    } catch (err) {

      console.error("ERROR asignación:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al asignar proyecto."
      });

    }
  },
  /**
 * PUT /api/evaluaciones/:id/reabrir
 * ADMIN: Reabrir evaluación para que el evaluador pueda volver a evaluar
 */
  async reabrirEvaluacion(req, res) {
    try {
      const evaluacionId = req.params.id;

      const result = await EvaluacionService.reabrirEvaluacion(evaluacionId);

      return res.json(result);

    } catch (err) {
      console.error("ERROR reabrirEvaluacion:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al reabrir la evaluación"
      });
    }
  },

  /**
   * DELETE /api/evaluaciones/:id
   * ADMIN: Eliminar evaluación completamente
   */
  async eliminarEvaluacion(req, res) {
    try {
      const evaluacionId = req.params.id;

      const result = await EvaluacionService.eliminarEvaluacion(evaluacionId);

      return res.json(result);

    } catch (err) {
      console.error("ERROR eliminarEvaluacion:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al eliminar la evaluación"
      });
    }
  },

  /**
   * GET /api/evaluaciones/:id/editar
   * EVALUADOR: Obtener detalles de evaluación para editar
   */
  async getEvaluacionParaEditar(req, res) {
    try {
      const evaluacionId = req.params.id;
      const evaluadorId = req.usuario.id;

      // Verificar que el evaluador sea el dueño de la evaluación
      const [evaluacion] = await db.query(
        `SELECT evaluador_id FROM evaluaciones WHERE id = ?`,
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

  /**
   * PUT /api/evaluaciones/:id/actualizar
   * EVALUADOR: Actualizar respuestas (sin finalizar)
   */
  async actualizarEvaluacion(req, res) {
    try {
      const evaluacionId = req.params.id;
      const evaluadorId = req.usuario.id;

      // Verificar que el evaluador sea el dueño
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

      return res.json(result);

    } catch (err) {
      console.error("ERROR actualizarEvaluacion:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al actualizar la evaluación"
      });
    }
  },

  /**
   * POST /api/evaluaciones/:id/finalizar
   * EVALUADOR: Finalizar evaluación (cambiar estado a evaluado)
   */
  async finalizarEvaluacion(req, res) {
    try {
      const evaluacionId = req.params.id;
      const evaluadorId = req.usuario.id;

      // Verificar que el evaluador sea el dueño
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

      return res.json(result);

    } catch (err) {
      console.error("ERROR finalizarEvaluacion:", err);
      return res.status(500).json({
        ok: false,
        mensaje: err.message || "Error al finalizar la evaluación"
      });
    }
  }
};

module.exports = evaluacionController;