const express = require('express');
const router = express.Router();
const reporteController = require('../controller/reporteController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ==============================
// ESTADÍSTICAS
// ==============================
router.get('/stats', authMiddleware, roleMiddleware('admin'), reporteController.stats);

// ==============================
// RANKING
// ==============================
router.get('/ranking', authMiddleware, roleMiddleware('admin'), reporteController.ranking);

// ==============================
// REPORTES POR PROYECTO
// ==============================
router.get('/proyectos', authMiddleware, roleMiddleware('admin'), reporteController.proyectos);

// ==============================
// DETALLE DE PROYECTO
// ==============================
router.get('/proyecto/:proyectoId', authMiddleware, roleMiddleware('admin'), reporteController.detalleProyecto);

// ==============================
// DETALLE COMPLETO DE UNA EVALUACIÓN (respuestas por criterio)
// ==============================
router.get('/evaluacion/:evaluacionId/detalle', authMiddleware, roleMiddleware('admin'), reporteController.detalleEvaluacion);

// ==============================
// EXPORTAR EXCEL GENERAL
// ==============================
router.get('/exportar', authMiddleware, roleMiddleware('admin'), reporteController.exportar);

// ==============================
// EXPORTAR EXCEL POR PROYECTO
// ==============================
router.get('/exportar/proyecto/:proyectoId', authMiddleware, roleMiddleware('admin'), reporteController.exportarProyecto);

// ==============================
// EXPORTAR PDF GENERAL
// ==============================
router.get('/exportar-pdf', authMiddleware, roleMiddleware('admin'), reporteController.exportarPDF);

// ==============================
// EXPORTAR PDF POR PROYECTO
// ==============================
router.get('/exportar-pdf/proyecto/:proyectoId', authMiddleware, roleMiddleware('admin'), reporteController.exportarPDFProyecto);

module.exports = router;