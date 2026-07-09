const AsignacionService = require('../services/asignacionService');

const controller = {

  async listar(req, res) {
    try {
      const data = await AsignacionService.getAsignaciones();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al listar asignaciones'
      });
    }
  },

  async proyectos(req, res) {
    try {
      const data = await AsignacionService.getProyectos();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener proyectos'
      });
    }
  },

  async evaluadores(req, res) {
    try {
      const data = await AsignacionService.getEvaluadores();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener evaluadores'
      });
    }
  },

  async crear(req, res) {
    try {
      console.log("========================================");
      console.log("📥 CREAR ASIGNACION");
      console.log("📦 BODY RECIBIDO:", req.body);
      console.log("👤 Usuario:", req.usuario);
      console.log("========================================");

      const { proyectoId, evaluadorId, proyecto_id, evaluador_id } = req.body;
      
      // soportar ambos formatos
      const proyecto = proyectoId || proyecto_id;
      const evaluador = evaluadorId || evaluador_id;

      console.log("📌 Proyecto ID:", proyecto);
      console.log("📌 Evaluador ID:", evaluador);

      if (!proyecto || !evaluador) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Datos incompletos: proyecto y evaluador son obligatorios'
        });
      }

      const data = await AsignacionService.crear(proyecto, evaluador);

      console.log("✅ ASIGNACION CREADA:", data);

      return res.status(201).json({
        ok: true,
        mensaje: 'Asignación creada correctamente',
        data
      });

    } catch (err) {
      console.error("❌ ERROR CREANDO ASIGNACION:", err);
      
      // Mensajes de error amigables
      let mensaje = err.message;
      if (mensaje === 'El proyecto no tiene rúbrica') {
        mensaje = 'El proyecto no tiene una rúbrica asociada. Se creará automáticamente.';
      }

      return res.status(400).json({
        ok: false,
        mensaje: mensaje
      });
    }
  },

  async eliminar(req, res) {
    try {
      await AsignacionService.eliminar(req.params.id);

      return res.json({
        ok: true,
        mensaje: 'Asignación eliminada correctamente'
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar asignación'
      });
    }
  }
};

module.exports = controller;