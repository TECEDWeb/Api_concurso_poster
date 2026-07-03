const express = require('express');
const router = express.Router();

const evaluacionController = require('../controller/evaluacionController');
const authMiddleware = require('../middleware/authMiddleware');

// =========================
// ADMIN / GENERAL
// =========================
router.get('/', authMiddleware, evaluacionController.getAll);
router.get('/reporte-admin', authMiddleware, evaluacionController.getReporteAdmin);

// =========================
// EVALUADOR
// =========================
router.get('/asignados', authMiddleware, evaluacionController.getAsignados);
router.get('/mis-resultados', authMiddleware, evaluacionController.getMisResultados);
router.get('/resumen', authMiddleware, evaluacionController.getResumen);

// =========================
// FORMULARIO (IMPORTANTE)
// =========================
router.get('/:id/formulario', authMiddleware, evaluacionController.getFormulario);
router.post('/:id/guardar', authMiddleware, evaluacionController.guardar);

module.exports = router;