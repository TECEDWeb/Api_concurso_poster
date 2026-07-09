const RubricaService = require('../services/rubricaService');

class RubricaController {

  static async listar(req, res) {
    try {
      console.log('📥 GET /api/rubricas');
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

  static async obtener(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 GET /api/rubricas/' + id);

      const rubrica = await RubricaService.obtener(id);

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

  static async crear(req, res) {
    try {
      console.log('📥 POST /api/rubricas', req.body);
      
      // Validar que tenga concursoId
      if (!req.body.concursoId) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El ID del concurso es obligatorio'
        });
      }

      const rubrica = await RubricaService.crear(req.body);

      return res.status(201).json({
        ok: true,
        mensaje: 'Rúbrica creada correctamente',
        data: rubrica
      });

    } catch (error) {
      console.error('ERROR crear rubrica:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear rúbrica: ' + error.message
      });
    }
  }

  static async actualizar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 PUT /api/rubricas/' + id, req.body);

      const rubrica = await RubricaService.actualizar(id, req.body);

      return res.json({
        ok: true,
        mensaje: 'Rúbrica actualizada correctamente',
        data: rubrica
      });

    } catch (error) {
      console.error('ERROR actualizar rubrica:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar rúbrica: ' + error.message
      });
    }
  }

  static async eliminar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 DELETE /api/rubricas/' + id);

      const eliminado = await RubricaService.eliminar(id);

      if (!eliminado) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Rúbrica no encontrada'
        });
      }

      return res.json({
        ok: true,
        mensaje: 'Rúbrica eliminada correctamente'
      });

    } catch (error) {
      console.error('ERROR eliminar rubrica:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar rúbrica: ' + error.message
      });
    }
  }

  static async exportar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 GET /api/rubricas/' + id + '/exportar');

      const excelBuffer = await RubricaService.exportar(id);

      if (!excelBuffer) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Rúbrica no encontrada'
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=rubrica-concurso-' + id + '.xlsx');
      res.send(excelBuffer);

    } catch (error) {
      console.error('ERROR exportar rubrica:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al exportar rúbrica'
      });
    }
  }
}

module.exports = RubricaController;