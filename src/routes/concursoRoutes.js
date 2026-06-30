const express = require('express');

const router = express.Router();

const controller = require('../controller/concursoController');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get(
  '/',
  controller.listar
);

router.get(
  '/:id',
  controller.obtenerPorId
);

router.post(
  '/',
  roleMiddleware(['administrador']),
  controller.crear
);

router.put(
  '/:id',
  roleMiddleware(['administrador']),
  controller.actualizar
);

router.delete(
  '/:id',
  roleMiddleware(['administrador']),
  controller.eliminar
);

module.exports = router;