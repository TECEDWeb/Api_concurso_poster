const EvaluacionService = require('../services/evaluacionService');
const db = require('../config/db');

const evaluacionController = {

  // ============================================
  // MÉTODOS EXISTENTES
  // ============================================

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

      const [result] = await db.query(
        `INSERT INTO evaluaciones (proyecto_id, evaluador_id, rubrica_id, estado, fecha_asignacion)
         VALUES (?, ?, ?, 'asignado', NOW())`,
        [proyecto_id, evaluador_id, rubrica_id]
      );

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
      console.error("❌ ERROR FORMULARIO:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener formulario: " + err.message
      });
    }
  },

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

      const result = await EvaluacionService.asignarProyecto(evaluador_id, proyecto_id);

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

  // ============================================
  // NUEVOS MÉTODOS PARA EDICIÓN
  // ============================================

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

  async finalizarEvaluacion(req, res) {
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
  },

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
  }
};

module.exports = evaluacionController;