const express = require('express');
const router = express.Router();
const RubricaController = require('../controller/rubricaController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, RubricaController.listar);
router.get('/:concursoId', authMiddleware, RubricaController.obtener);

module.exports = router;