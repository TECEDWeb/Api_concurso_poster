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
      const { proyectoId, evaluadorId } = req.body;

      if (!proyectoId || !evaluadorId) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Datos incompletos'
        });
      }

      const id = await AsignacionService.crear(proyectoId, evaluadorId);

      return res.json({
        ok: true,
        id
      });

    } catch (err) {
      console.error(err);

      return res.status(400).json({
        ok: false,
        mensaje: err.message
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