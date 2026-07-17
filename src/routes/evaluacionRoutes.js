const express = require('express');
const router = express.Router();

const evaluacionController = require('../controller/evaluacionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

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

router.post('/asignar', authMiddleware, roleMiddleware('admin'), evaluacionController.asignar );
// ADMIN: Reabrir evaluación
router.put('/:id/reabrir', auth, isAdmin, evaluacionController.reabrirEvaluacion);

// ADMIN: Eliminar evaluación
router.delete('/:id', auth, isAdmin, evaluacionController.eliminarEvaluacion);

// EVALUADOR: Obtener evaluación para editar
router.get('/:id/editar', auth, evaluacionController.getEvaluacionParaEditar);

// EVALUADOR: Actualizar evaluación (sin finalizar)
router.put('/:id/actualizar', auth, evaluacionController.actualizarEvaluacion);

// EVALUADOR: Finalizar evaluación
router.post('/:id/finalizar', auth, evaluacionController.finalizarEvaluacion);
module.exports = router;