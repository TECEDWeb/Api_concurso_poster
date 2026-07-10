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
// DETALLE DE PROYECTO (NUEVO)
// ==============================
router.get('/proyecto/:proyectoId', authMiddleware, roleMiddleware('admin'), reporteController.detalleProyecto);

// ==============================
// EXPORTAR EXCEL GENERAL
// ==============================
router.get('/exportar', authMiddleware, roleMiddleware('admin'), reporteController.exportar);

// ==============================
// EXPORTAR EXCEL POR PROYECTO (NUEVO)
// ==============================
router.get('/exportar/proyecto/:proyectoId', authMiddleware, roleMiddleware('admin'), reporteController.exportarProyecto);

module.exports = router;