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
      
      // ✅ MENSAJES AMIGABLES PARA EL USUARIO
      let mensaje = err.message;
      let statusCode = 400;

      // Detectar errores específicos
      if (mensaje === 'El proyecto no tiene rúbrica') {
        mensaje = '❌ El proyecto no tiene una rúbrica asociada. Por favor, crea una rúbrica primero.';
      } else if (mensaje === 'La rúbrica no tiene secciones configuradas. Ve a Rúbricas → Configurar contenido primero.') {
        mensaje = '⚠️ La rúbrica existe pero está vacía. Ve a la sección Rúbricas y configura el contenido (secciones y criterios).';
      } else if (mensaje === 'Ya existe una evaluación para este proyecto y evaluador') {
        mensaje = '⚠️ Ya existe una asignación para este proyecto y evaluador.';
      } else if (mensaje === 'Proyecto no encontrado') {
        mensaje = '❌ Proyecto no encontrado. Verifica que exista.';
        statusCode = 404;
      } else if (mensaje === 'Evaluador no encontrado') {
        mensaje = '❌ Evaluador no encontrado. Verifica que exista y tenga rol de evaluador.';
        statusCode = 404;
      }

      return res.status(statusCode).json({
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