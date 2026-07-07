const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Ruta principal para admin
router.get(
  '/admin',
  authMiddleware,
  roleMiddleware('admin'),
  dashboardController.adminDashboard
);

// Alias para compatibilidad con frontend
router.get(
  '/admin/resumen',
  authMiddleware,
  roleMiddleware('admin'),
  dashboardController.adminResumen
);

// Actividades recientes
router.get(
  '/actividades-recientes',
  authMiddleware,
  dashboardController.actividadesRecientes
);

// Notificaciones
router.get(
  '/notificaciones',
  authMiddleware,
  dashboardController.notificaciones
);

// Contar notificaciones
router.get(
  '/notificaciones/contar',
  authMiddleware,
  dashboardController.contarNotificaciones
);

// Marcar notificaciones como leídas
router.post(
  '/notificaciones/leer',
  authMiddleware,
  dashboardController.marcarNotificacionesLeidas
);

module.exports = router;