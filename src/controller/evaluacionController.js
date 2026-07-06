const EvaluacionService = require('../services/evaluacionService');
const db = require('../config/db');

const evaluacionController = {

  /**
   * GET /api/evaluaciones
   */
  async getAll(req, res) {
    try {
      const data = await EvaluacionService.getTodosResultados();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error("ERROR getAll:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener evaluaciones"
      });
    }
  },

  /**
   * GET /api/evaluaciones/reporte-admin
   */
  async getReporteAdmin(req, res) {
    try {
      const data = await EvaluacionService.getTodosResultados();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error("ERROR reporte:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al generar reporte"
      });
    }
  },

  /**
   * GET /api/evaluaciones/asignados
   */
  async getAsignados(req, res) {
    try {
      const evaluadorId = req.usuario.id;

      const data = await EvaluacionService.getAsignados(evaluadorId);

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error("ERROR asignados:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener proyectos asignados"
      });
    }
  },

  /**
   * GET /api/evaluaciones/:id/formulario
   */
  async getFormulario(req, res) {

    try {

      console.log("=================================");
      console.log("📥 SOLICITUD FORMULARIO");
      console.log("ID RECIBIDO:", req.params.id);
      console.log("USUARIO:", req.usuario);
      console.log("=================================");


      const evaluacionId = req.params.id;


      const data = await EvaluacionService.getFormulario(
        evaluacionId
      );


      console.log("📤 RESPUESTA FORMULARIO:");
      console.log(JSON.stringify(data,null,2));


      return res.json({
        ok:true,
        data
      });


    } catch(err){

      console.error(
        "ERROR FORMULARIO:",
        err
      );


      return res.status(500).json({
        ok:false,
        mensaje:"Error formulario"
      });

    }

  },

  /**
   * POST /api/evaluaciones/:id/guardar
   */
  async guardar(req, res) {
    try {
      const evaluacionId = req.params.id;

      await EvaluacionService.guardarEvaluacion({
        evaluacionId,
        observacion: req.body.observacion,
        detalles: req.body.detalles
      });

      return res.json({
        ok: true,
        mensaje: "Evaluación guardada correctamente"
      });

    } catch (err) {
      console.error("ERROR guardar:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al guardar evaluación"
      });
    }
  },

  /**
   * GET /api/evaluaciones/mis-resultados
   */
  async getMisResultados(req, res) {
    try {
      const evaluadorId = req.usuario.id;

      const data = await EvaluacionService.getMisResultados(evaluadorId);

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error("ERROR resultados:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener resultados"
      });
    }
  },

  /**
   * GET /api/evaluaciones/resumen
   */
  async getResumen(req, res) {
    try {
      const data = await EvaluacionService.getResumenEvaluador();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error("ERROR resumen:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener resumen"
      });
    }
  },

 async asignar(req, res) {
    try {

      const { proyectoId, evaluadores } = req.body;

      // Validación
      if (
        !proyectoId ||
        !Array.isArray(evaluadores) ||
        evaluadores.length === 0
      ) {
        return res.status(400).json({
          ok: false,
          mensaje: "Debe seleccionar un proyecto y al menos un evaluador."
        });
      }

      await EvaluacionService.asignarMasivo(
        proyectoId,
        evaluadores
      );

      return res.json({
        ok: true,
        mensaje: "Proyecto asignado correctamente."
      });

    } catch (err) {

      console.error("ERROR asignación:", err);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al asignar proyecto."
      });

    }
  }
};

module.exports = evaluacionController;