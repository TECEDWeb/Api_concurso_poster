const express = require('express');
const router = express.Router();
// ✅ CORREGIDO: usar 'controller' (singular)
const evaluadorController = require('../controller/evaluadorController');
// ✅ CORREGIDO: usar 'controller' (singular)
const evaluacionController = require('../controller/evaluacionController');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================
// RUTAS PARA EVALUADOR
// ============================================

// GET /api/evaluador/dashboard-stats
router.get('/dashboard-stats', authMiddleware, evaluadorController.getDashboardStats);

// GET /api/evaluador/actividades-recientes
router.get('/actividades-recientes', authMiddleware, evaluadorController.getActividadesRecientes);

// GET /api/evaluador/proyectos-asignados
router.get('/proyectos-asignados', authMiddleware, evaluadorController.getProyectosAsignados);

// GET /api/evaluador/proyecto/:id
router.get('/proyecto/:id', authMiddleware, evaluadorController.getProyectoAsignado);

// POST /api/evaluador/evaluacion
router.post('/evaluacion', authMiddleware, evaluadorController.guardarEvaluacion);

// GET /api/evaluador/mis-resultados
router.get('/mis-resultados', authMiddleware, evaluadorController.getMisResultados);

// GET /api/evaluador/resultado/:id
router.get('/resultado/:id', authMiddleware, evaluadorController.getResultadoDetalle);

module.exports = router;