const RubricaService = require('../services/rubricaService');

const rubricaController = {

  // =========================
  // LISTAR RÚBRICAS
  // =========================
  async listar(req, res) {
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
  },

  // =========================
  // OBTENER RÚBRICA POR CONCURSO
  // =========================
  async obtener(req, res) {
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
  },

  // =========================
  // CREAR RÚBRICA
  // =========================
  async crear(req, res) {
    try {
      console.log('📥 POST /api/rubricas', req.body);

      // Validar que tenga concurso_id
      if (!req.body.concurso_id) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El ID del concurso es obligatorio'
        });
      }

      // Validar que tenga nombre
      if (!req.body.nombre) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre de la rúbrica es obligatorio'
        });
      }

      const rubrica = await RubricaService.crear({
        concurso_id: req.body.concurso_id,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion || null,
        puntaje_maximo: req.body.puntaje_maximo || 100,
        secciones: req.body.secciones || [],
        niveles: req.body.niveles || []
      });

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
  },

  // =========================
  // ACTUALIZAR RÚBRICA
  // =========================
  async actualizar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 PUT /api/rubricas/' + id, req.body);

      // Validar que tenga nombre
      if (!req.body.nombre) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre de la rúbrica es obligatorio'
        });
      }

      const rubrica = await RubricaService.actualizar(id, {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion || null,
        puntaje_maximo: req.body.puntaje_maximo || 100
      });

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
  },

  // =========================
  // ELIMINAR RÚBRICA
  // =========================
  async eliminar(req, res) {
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
  },

  // =========================
  // EXPORTAR RÚBRICA
  // =========================
  async exportar(req, res) {
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
};

module.exports = rubricaController;