const RubricaService = require('../services/rubricaService');

class RubricaController {

  // =========================
  // LISTAR RÚBRICAS
  // =========================
  static async listar(req, res) {
    try {

      const rubricas = await RubricaService.listar();

      return res.json({
        ok: true,
        data: rubricas || []
      });

    } catch (error) {

      console.error('ERROR listar rubricas:', error);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al listar rúbricas'
      });
    }
  }


  // =========================
  // OBTENER POR CONCURSO
  // =========================
  static async obtener(req, res) {
    try {

      const concursoId = parseInt(req.params.concursoId);

      const rubrica = await RubricaService.obtener(concursoId);

      if (!rubrica) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Rúbrica no encontrada'
        });
      }

      return res.json({
        ok: true,
        data: rubrica
      });

    } catch (error) {

      console.error('ERROR obtener rubrica:', error);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener rúbrica'
      });
    }
  }

}

module.exports = RubricaController;