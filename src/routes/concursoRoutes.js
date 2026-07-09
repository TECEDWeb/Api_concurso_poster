const express = require('express');
const router = express.Router();
const controller = require('../controller/concursoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// LISTAR CONCURSOS (solo autenticación, sin roles específicos)
router.get(
  '/',
  authMiddleware,
  controller.listar
);

// OBTENER POR ID (solo autenticación)
router.get(
  '/:id',
  authMiddleware,
  controller.obtenerPorId
);

// CREAR CONCURSO (admin)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'), // ← CORRECTO: pasar string, no array
  controller.crear
);

// ACTUALIZAR CONCURSO (admin)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'), // ← CORRECTO: pasar string, no array
  controller.actualizar
);

// ELIMINAR CONCURSO (admin)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'), // ← CORRECTO: pasar string, no array
  controller.eliminar
);

module.exports = router;