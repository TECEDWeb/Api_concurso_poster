const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const controller = require('../controller/asignacionController');

// listado
router.get('/', auth, controller.listar);

// datos para combos
router.get('/proyectos', auth, controller.proyectos);
router.get('/evaluadores', auth, controller.evaluadores);

// crear asignación
router.post('/', auth, controller.crear);

// eliminar asignación
router.delete('/:id', auth, controller.eliminar);

module.exports = router;