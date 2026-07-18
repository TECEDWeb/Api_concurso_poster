const express = require('express');
const router = express.Router();
const evaluadorController = require('../controller/evaluadorController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard-stats', authMiddleware, evaluadorController.getDashboardStats);
router.get('/actividades-recientes', authMiddleware, evaluadorController.getActividadesRecientes);
router.get('/proyectos-asignados', authMiddleware, evaluadorController.getProyectosAsignados);
router.get('/proyecto/:id', authMiddleware, evaluadorController.getProyectoAsignado);
router.post('/evaluacion', authMiddleware, evaluadorController.guardarEvaluacion);
router.get('/mis-resultados', authMiddleware, evaluadorController.getMisResultados);
router.get('/resultado/:id', authMiddleware, evaluadorController.getResultadoDetalle);

module.exports = router;