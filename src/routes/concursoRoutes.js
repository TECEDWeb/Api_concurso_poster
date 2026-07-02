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
  roleMiddleware(['admin']),
  controller.crear
);

router.put(
  '/:id',
  roleMiddleware(['admin']),
  controller.actualizar
);

router.delete(
  '/:id',
  roleMiddleware(['admin']),
  controller.eliminar
);

module.exports = router;