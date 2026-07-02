const EvaluacionService = require('../services/evaluacionService');
const db = require('../config/db');

const evaluacionController = {

  /**
   * GET /api/evaluaciones
   */
  async getAll(req, res) {
    try {
      const rows = await EvaluacionService.getTodosResultados();

      return res.json({
        ok: true,
        data: rows || []
      });

    } catch (err) {
      console.error('ERROR getAll evaluaciones:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener evaluaciones'
      });
    }
  },


  /**
   * GET /api/evaluaciones/admin
   */
  async getReporteAdmin(req, res) {
    try {
      const rows = await EvaluacionService.getTodosResultados();

      return res.json({
        ok: true,
        data: rows || []
      });

    } catch (err) {
      console.error('ERROR reporte admin:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener reporte'
      });
    }
  },


  /**
   * GET /api/evaluaciones/asignados
   */
  async getAsignados(req, res) {
    try {
      const id = req.usuario?.id;

      console.log("USER TOKEN:", req.usuario);

      if (!id) {
        return res.status(401).json({
          ok: false,
          mensaje: 'No autenticado'
        });
      }

      const rows = await EvaluacionService.getAsignados(id);

      return res.json({
        ok: true,
        data: rows || []
      });

    } catch (err) {
      console.error("ERROR ASIGNADOS:", err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener evaluaciones asignadas'
      });
    }
  },


  /**
   * GET /api/evaluaciones/mis-resultados
   */
  async getMisResultados(req, res) {
    try {
      const id = req.usuario?.id;

      if (!id) {
        return res.status(401).json({
          ok: false,
          mensaje: 'No autenticado'
        });
      }

      const rows = await EvaluacionService.getMisResultados(id);

      return res.json({
        ok: true,
        data: rows || []
      });

    } catch (err) {
      console.error('ERROR mis resultados:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener resultados'
      });
    }
  },


  /**
   * POST /api/evaluaciones
   */
  async create(req, res) {
    try {
      const { proyectoId, nota, observacion } = req.body;
      const evaluadorId = req.usuario?.id;

      if (!evaluadorId) {
        return res.status(401).json({
          ok: false,
          mensaje: 'No autenticado'
        });
      }

      if (!proyectoId || nota == null) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Datos incompletos'
        });
      }

      const [asignada] = await db.query(
        `SELECT id 
         FROM evaluaciones 
         WHERE evaluador_id = ? AND proyecto_id = ?`,
        [evaluadorId, proyectoId]
      );

      if (!asignada || asignada.length === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Evaluación no asignada'
        });
      }

      await EvaluacionService.guardarEvaluacion(
        asignada[0].id,
        nota,
        observacion
      );

      return res.json({
        ok: true,
        mensaje: 'Evaluación guardada correctamente'
      });

    } catch (err) {
      console.error('ERROR create evaluación:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al guardar evaluación'
      });
    }
  }

};

module.exports = evaluacionController;