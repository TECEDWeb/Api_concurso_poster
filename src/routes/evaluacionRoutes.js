const express = require('express');
const router = express.Router();
const evaluacionController = require('../controller/evaluacionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware'); // ← CAMBIAR

// ============================================
// RUTAS DE EVALUACIONES
// ============================================

// GET /api/evaluaciones - Listar todas las evaluaciones (admin)
router.get('/', authMiddleware, roleMiddleware('admin'), evaluacionController.getAll);

// GET /api/evaluaciones/reporte-admin - Reporte para admin
router.get('/reporte-admin', authMiddleware, roleMiddleware('admin'), evaluacionController.getReporteAdmin);

// GET /api/evaluaciones/asignados - Proyectos asignados al evaluador
router.get('/asignados', authMiddleware, evaluacionController.getAsignados);

// GET /api/evaluaciones/mis-resultados - Resultados del evaluador
router.get('/mis-resultados', authMiddleware, evaluacionController.getMisResultados);

// GET /api/evaluaciones/resumen - Resumen de evaluaciones
router.get('/resumen', authMiddleware, evaluacionController.getResumen);

// GET /api/evaluaciones/:id/formulario - Formulario para evaluar
router.get('/:id/formulario', authMiddleware, evaluacionController.getFormulario);

// GET /api/evaluaciones/:id/editar - Obtener evaluación para editar (evaluador)
router.get('/:id/editar', authMiddleware, evaluacionController.getEvaluacionParaEditar);

// POST /api/evaluaciones/asignar - Asignar proyecto a evaluador (admin)
router.post('/asignar', authMiddleware, roleMiddleware('admin'), evaluacionController.asignar);

// POST /api/evaluaciones/:id/guardar - Guardar evaluación (evaluador)
router.post('/:id/guardar', authMiddleware, evaluacionController.guardar);

// PUT /api/evaluaciones/:id/actualizar - Actualizar evaluación (evaluador)
router.put('/:id/actualizar', authMiddleware, evaluacionController.actualizarEvaluacion);

// POST /api/evaluaciones/:id/finalizar - Finalizar evaluación (evaluador)
router.post('/:id/finalizar', authMiddleware, evaluacionController.finalizarEvaluacion);

// PUT /api/evaluaciones/:id/reabrir - Reabrir evaluación (admin)
router.put('/:id/reabrir', authMiddleware, roleMiddleware('admin'), evaluacionController.reabrirEvaluacion);

// DELETE /api/evaluaciones/:id - Eliminar evaluación (admin)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), evaluacionController.eliminarEvaluacion);

// GET /api/evaluaciones/:id - Obtener evaluación por ID (admin)
router.get('/:id', authMiddleware, roleMiddleware('admin'), evaluacionController.getById);

// POST /api/evaluaciones - Crear evaluación (admin)
router.post('/', authMiddleware, roleMiddleware('admin'), evaluacionController.create);

// PUT /api/evaluaciones/:id - Actualizar evaluación (admin)
router.put('/:id', authMiddleware, roleMiddleware('admin'), evaluacionController.update);

module.exports = router;