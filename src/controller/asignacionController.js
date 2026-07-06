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
      console.log("====== CREAR ASIGNACION ======");
      console.log(req.body);
      console.log("Usuario:", req.usuario);
      const {
        proyectoId,
        evaluadorId,
        proyecto_id,
        evaluador_id
      } = req.body;
      // soportar ambos formatos
      const proyecto = proyectoId || proyecto_id;
      const evaluador = evaluadorId || evaluador_id;
      if (!proyecto || !evaluador) {
        return res.status(400).json({
          ok:false,
          mensaje:'Datos incompletos'
        });
      }
      const data = await AsignacionService.crear(
        proyecto,
        evaluador
      );
      return res.json({
        ok:true,
        data
      });
    } catch(err) {
      console.error(
        "ERROR CREANDO ASIGNACION:",
        err
      );
      return res.status(400).json({
        ok:false,
        mensaje:err.message
      });
    }
  },

  async eliminar(req, res) {
    try {
      await AsignacionService.eliminar(req.params.id);

      return res.json({
        ok: true
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