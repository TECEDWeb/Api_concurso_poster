const express = require('express');
const router = express.Router();
const reporteController = require('../controller/reporteController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/stats', authMiddleware, roleMiddleware('admin'), reporteController.stats);
router.get('/ranking', authMiddleware, roleMiddleware('admin'), reporteController.ranking);
router.get('/proyectos', authMiddleware, roleMiddleware('admin'), reporteController.proyectos);
router.get('/proyecto/:proyectoId', authMiddleware, roleMiddleware('admin'), reporteController.detalleProyecto);
router.get('/evaluacion/:evaluacionId/detalle', authMiddleware, roleMiddleware('admin'), reporteController.detalleEvaluacion);
router.get('/exportar', authMiddleware, roleMiddleware('admin'), reporteController.exportar);
router.get('/exportar/proyecto/:proyectoId', authMiddleware, roleMiddleware('admin'), reporteController.exportarProyecto);
router.get('/exportar-pdf', authMiddleware, roleMiddleware('admin'), reporteController.exportarPDF);
router.get('/exportar-pdf/proyecto/:proyectoId', authMiddleware, roleMiddleware('admin'), reporteController.exportarPDFProyecto);

module.exports = router;