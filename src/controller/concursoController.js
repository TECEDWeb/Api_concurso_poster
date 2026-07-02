const Concurso = require('../model/concursoModel');

const concursoController = {

  /**
   * GET /api/concursos
   */
  async listar(req, res) {
    try {
      const concursos = await Concurso.listar();

      return res.json({
        ok: true,
        data: concursos
      });

    } catch (err) {
      console.error('ERROR listar concursos:', err.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al listar concursos'
      });
    }
  },


  /**
   * GET /api/concursos/:id
   */
  async obtenerPorId(req, res) {
    try {
      const concurso = await Concurso.buscarPorId(req.params.id);

      if (!concurso) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Concurso no encontrado'
        });
      }

      return res.json({
        ok: true,
        data: concurso
      });

    } catch (err) {
      console.error('ERROR obtener concurso:', err.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener concurso'
      });
    }
  },


  /**
   * POST /api/concursos
   */
  async crear(req, res) {
    try {
      const id = await Concurso.crear(req.body);

      return res.status(201).json({
        ok: true,
        mensaje: 'Concurso creado correctamente',
        data: {
          id
        }
      });

    } catch (err) {
      console.error('ERROR crear concurso:', err.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear concurso'
      });
    }
  },


  /**
   * PUT /api/concursos/:id
   */
  async actualizar(req, res) {
    try {
      await Concurso.actualizar(req.params.id, req.body);

      return res.json({
        ok: true,
        mensaje: 'Concurso actualizado correctamente'
      });

    } catch (err) {
      console.error('ERROR actualizar concurso:', err.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar concurso'
      });
    }
  },


  /**
   * DELETE /api/concursos/:id
   */
  async eliminar(req, res) {
    try {
      await Concurso.eliminar(req.params.id);

      return res.json({
        ok: true,
        mensaje: 'Concurso eliminado correctamente'
      });

    } catch (err) {
      console.error('ERROR eliminar concurso:', err.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar concurso'
      });
    }
  }

};

module.exports = concursoController;