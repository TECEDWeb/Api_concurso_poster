const express = require('express');
const router = express.Router();
// ✅ CORREGIDO: usar 'controller' (singular)
const evaluacionController = require('../controller/evaluacionController');
const authMiddleware = require('../middleware/authMiddleware');
const isAdminMiddleware = require('../middleware/isAdminMiddleware');

// ============================================
// RUTAS DE EVALUACIONES
// ============================================

// GET /api/evaluaciones - Listar todas las evaluaciones (admin)
router.get('/', authMiddleware, isAdminMiddleware, evaluacionController.getAll);

// GET /api/evaluaciones/reporte-admin - Reporte para admin
router.get('/reporte-admin', authMiddleware, isAdminMiddleware, evaluacionController.getReporteAdmin);

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
router.post('/asignar', authMiddleware, isAdminMiddleware, evaluacionController.asignar);

// POST /api/evaluaciones/:id/guardar - Guardar evaluación (evaluador)
router.post('/:id/guardar', authMiddleware, evaluacionController.guardar);

// PUT /api/evaluaciones/:id/actualizar - Actualizar evaluación (evaluador)
router.put('/:id/actualizar', authMiddleware, evaluacionController.actualizarEvaluacion);

// POST /api/evaluaciones/:id/finalizar - Finalizar evaluación (evaluador)
router.post('/:id/finalizar', authMiddleware, evaluacionController.finalizarEvaluacion);

// PUT /api/evaluaciones/:id/reabrir - Reabrir evaluación (admin)
router.put('/:id/reabrir', authMiddleware, isAdminMiddleware, evaluacionController.reabrirEvaluacion);

// DELETE /api/evaluaciones/:id - Eliminar evaluación (admin)
router.delete('/:id', authMiddleware, isAdminMiddleware, evaluacionController.eliminarEvaluacion);

// GET /api/evaluaciones/:id - Obtener evaluación por ID (admin)
router.get('/:id', authMiddleware, isAdminMiddleware, evaluacionController.getById);

// POST /api/evaluaciones - Crear evaluación (admin)
router.post('/', authMiddleware, isAdminMiddleware, evaluacionController.create);

// PUT /api/evaluaciones/:id - Actualizar evaluación (admin)
router.put('/:id', authMiddleware, isAdminMiddleware, evaluacionController.update);

module.exports = router;