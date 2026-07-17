const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacionController');
const { auth, isAdmin } = require('../middlewares/auth');

// ============================================
// RUTAS PÚBLICAS (con autenticación)
// ============================================

// GET /api/evaluaciones - Listar todas las evaluaciones (admin)
router.get('/', auth, isAdmin, evaluacionController.getAll);

// GET /api/evaluaciones/reporte-admin - Reporte para admin
router.get('/reporte-admin', auth, isAdmin, evaluacionController.getReporteAdmin);

// GET /api/evaluaciones/asignados - Proyectos asignados al evaluador
router.get('/asignados', auth, evaluacionController.getAsignados);

// GET /api/evaluaciones/mis-resultados - Resultados del evaluador
router.get('/mis-resultados', auth, evaluacionController.getMisResultados);

// GET /api/evaluaciones/resumen - Resumen de evaluaciones
router.get('/resumen', auth, evaluacionController.getResumen);

// GET /api/evaluaciones/:id/formulario - Formulario para evaluar
router.get('/:id/formulario', auth, evaluacionController.getFormulario);

// GET /api/evaluaciones/:id/editar - Obtener evaluación para editar (evaluador)
router.get('/:id/editar', auth, evaluacionController.getEvaluacionParaEditar);

// POST /api/evaluaciones/asignar - Asignar proyecto a evaluador (admin)
router.post('/asignar', auth, isAdmin, evaluacionController.asignar);

// POST /api/evaluaciones/:id/guardar - Guardar evaluación (evaluador)
router.post('/:id/guardar', auth, evaluacionController.guardar);

// PUT /api/evaluaciones/:id/actualizar - Actualizar evaluación (evaluador)
router.put('/:id/actualizar', auth, evaluacionController.actualizarEvaluacion);

// POST /api/evaluaciones/:id/finalizar - Finalizar evaluación (evaluador)
router.post('/:id/finalizar', auth, evaluacionController.finalizarEvaluacion);

// PUT /api/evaluaciones/:id/reabrir - Reabrir evaluación (admin)
router.put('/:id/reabrir', auth, isAdmin, evaluacionController.reabrirEvaluacion);

// DELETE /api/evaluaciones/:id - Eliminar evaluación (admin)
router.delete('/:id', auth, isAdmin, evaluacionController.eliminarEvaluacion);

// GET /api/evaluaciones/:id - Obtener evaluación por ID (admin)
router.get('/:id', auth, isAdmin, evaluacionController.getById);

// POST /api/evaluaciones - Crear evaluación (admin)
router.post('/', auth, isAdmin, evaluacionController.create);

// PUT /api/evaluaciones/:id - Actualizar evaluación (admin)
router.put('/:id', auth, isAdmin, evaluacionController.update);

// DELETE /api/evaluaciones/:id - Eliminar evaluación (admin)
router.delete('/:id', auth, isAdmin, evaluacionController.remove);

module.exports = router;