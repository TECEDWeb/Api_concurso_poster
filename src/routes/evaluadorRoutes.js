const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const evaluadorController = require('../controller/evaluadorController');

console.log('======================================');
console.log('✅ evaluadorRoutes.js CARGADO');
console.log('======================================');

// ==============================
// DASHBOARD STATS
// ==============================
router.get(
  '/dashboard-stats',
  authMiddleware,
  roleMiddleware('evaluador'),
  evaluadorController.getDashboardStats
);

// ==============================
// ACTIVIDADES RECIENTES
// ==============================
router.get(
  '/actividades-recientes',
  authMiddleware,
  roleMiddleware('evaluador'),
  evaluadorController.getActividadesRecientes
);

// ==============================
// PROYECTOS ASIGNADOS
// ==============================
router.get(
  '/proyectos-asignados',
  authMiddleware,
  roleMiddleware('evaluador'),
  evaluadorController.getProyectosAsignados
);

// ==============================
// OBTENER PROYECTO ASIGNADO POR ID
// ==============================
router.get(
  '/proyecto/:id',
  authMiddleware,
  roleMiddleware('evaluador'),
  evaluadorController.getProyectoAsignado
);

// ==============================
// GUARDAR EVALUACIÓN
// ==============================
router.post(
  '/evaluacion',
  authMiddleware,
  roleMiddleware('evaluador'),
  evaluadorController.guardarEvaluacion
);

// ==============================
// MIS RESULTADOS
// ==============================
router.get(
  '/mis-resultados',
  authMiddleware,
  roleMiddleware('evaluador'),
  evaluadorController.getMisResultados
);

// ==============================
// DETALLE DE RESULTADO
// ==============================
router.get(
  '/resultado/:id',
  authMiddleware,
  roleMiddleware('evaluador'),
  evaluadorController.getResultadoDetalle
);

module.exports = router;