const express = require('express');
const router = express.Router();
const RubricaController = require('../controller/rubricaController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ==============================
// LISTAR RÚBRICAS
// ==============================
router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  RubricaController.listar
);

// ==============================
// OBTENER RÚBRICA POR CONCURSO
// ==============================
router.get(
  '/:concursoId',
  authMiddleware,
  roleMiddleware('admin'),
  RubricaController.obtener
);

// ==============================
// CREAR RÚBRICA
// ==============================
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  RubricaController.crear
);

// ==============================
// ACTUALIZAR RÚBRICA
// ==============================
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  RubricaController.actualizar
);

// ==============================
// ELIMINAR RÚBRICA
// ==============================
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  RubricaController.eliminar
);

// ==============================
// EXPORTAR RÚBRICA
// ==============================
router.get(
  '/:id/exportar',
  authMiddleware,
  roleMiddleware('admin'),
  RubricaController.exportar
);

module.exports = router;