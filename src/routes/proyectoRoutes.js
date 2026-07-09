const express = require('express');
const router = express.Router();
const controller = require('../controller/proyectoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

console.log('======================================');
console.log('✅ proyectoRoutes.js CARGADO');
console.log('======================================');

// Verificar que el controlador existe
console.log('controller:', Object.keys(controller));

// LISTAR PROYECTOS
router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  controller.getAll
);

// OBTENER PROYECTO POR ID
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  controller.getById
);

// CREAR PROYECTO
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  controller.create
);

// ACTUALIZAR PROYECTO
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  controller.update
);

// ELIMINAR PROYECTO
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  controller.remove
);

module.exports = router;