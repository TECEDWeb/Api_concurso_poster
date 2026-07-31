const CoordinadorAsignacionService = require('../services/coordinadorAsignacionService');

const controller = {

  async listar(req, res) {
    try {
      const data = await CoordinadorAsignacionService.listar();
      return res.json({ ok: true, data });
    } catch (err) {
      console.error('Error listando asignaciones de coordinador:', err);
      return res.status(500).json({ ok: false, mensaje: 'Error al listar asignaciones de coordinador' });
    }
  },

  async listarCoordinadores(req, res) {
    try {
      const data = await CoordinadorAsignacionService.listarCoordinadores();
      return res.json({ ok: true, data });
    } catch (err) {
      console.error('Error listando coordinadores:', err);
      return res.status(500).json({ ok: false, mensaje: 'Error al listar coordinadores' });
    }
  },

  async crear(req, res) {
    try {
      const { concursoId, coordinadorId } = req.body;

      if (!concursoId || !coordinadorId) {
        return res.status(400).json({ ok: false, mensaje: 'concursoId y coordinadorId son obligatorios' });
      }

      const data = await CoordinadorAsignacionService.asignar(concursoId, coordinadorId);
      return res.status(201).json({ ok: true, mensaje: 'Coordinador asignado correctamente', data });
    } catch (err) {
      console.error('Error asignando coordinador:', err);
      return res.status(400).json({ ok: false, mensaje: err.message || 'Error al asignar coordinador' });
    }
  },

  async eliminar(req, res) {
    try {
      const id = parseInt(req.params.id);
      await CoordinadorAsignacionService.eliminar(id);
      return res.json({ ok: true, mensaje: 'Asignación de coordinador eliminada' });
    } catch (err) {
      console.error('Error eliminando asignación de coordinador:', err);
      return res.status(500).json({ ok: false, mensaje: 'Error al eliminar la asignación' });
    }
  }
};

module.exports = controller;