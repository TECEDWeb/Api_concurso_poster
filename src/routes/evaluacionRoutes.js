const express = require('express');
const router = express.Router();

const controller = require('../controller/evaluacionController');

const verificarToken = require('../middleware/authMiddleware');
const verificarRol = require('../middleware/roleMiddleware');

// ========================
// FORMULARIO
// ========================

router.get(
  '/:id/formulario',
  verificarToken,
  controller.getFormulario
);

router.post(
  '/:id/guardar',
  verificarToken,
  controller.guardar
);

// ========================
// OTRAS RUTAS
// ========================

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
  '/resumen',
  verificarToken,
  controller.getResumen
);

router.get(
  '/',
  verificarToken,
  verificarRol('admin'),
  controller.getAll
);

router.get(
  '/reporte-admin',
  verificarToken,
  verificarRol('admin'),
  controller.getReporteAdmin
);

module.exports = router;