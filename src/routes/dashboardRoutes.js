const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/admin', authMiddleware, roleMiddleware('admin'), dashboardController.adminDashboard);
router.get('/admin/resumen', authMiddleware, roleMiddleware('admin'), dashboardController.adminResumen);
router.get('/actividades-recientes', authMiddleware, dashboardController.actividadesRecientes);
router.get('/notificaciones', authMiddleware, dashboardController.notificaciones);
router.get('/notificaciones/contar', authMiddleware, dashboardController.contarNotificaciones);
router.post('/notificaciones/leer', authMiddleware, dashboardController.marcarNotificacionesLeidas);

module.exports = router;