const express = require('express');
const router = express.Router();

// ⚠️ OJO: revisa que la carpeta sea "controllers" o "controller"
const controller = require('../controller/evaluacionController');

const verificarToken = require('../middleware/authMiddleware');
const verificarRol = require('../middleware/roleMiddleware');

// DEBUG (muy importante para encontrar el error)
console.log("CONTROLLER CARGADO:", controller);

// ADMIN REPORT
router.get(
  '/reporte-admin',
  verificarToken,
  verificarRol('admin'),
  controller.getReporteAdmin
);

router.get(
  '/asignados',
  verificarToken,
  controller.getAsignados
);

router.get(
  '/mis-resultados',
  verificarToken,
  controller.getMisResultados
);

router.get(
  '/',
  verificarToken,
  verificarRol('administrador'),
  controller.getAll
);

router.post(
  '/',
  verificarToken,
  controller.create
);

router.get(
  '/resumen',
  verificarToken,
  controller.getResumen
);
module.exports = router;