const express = require('express');
const router = express.Router();
const controller = require('../controller/certificadoController');

router.get('/', controller.getAll);
router.patch('/:id/validar', controller.validar);
router.post('/:id/regenerar', controller.regenerar);

module.exports = router;