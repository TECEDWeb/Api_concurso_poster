const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const controller = require('../controller/asignacionController');

// listar asignaciones
router.get('/', auth, role('admin'), controller.listar);

// combos
router.get('/proyectos', auth, controller.proyectos);
router.get('/evaluadores', auth, controller.evaluadores);

// crear asignación
router.post('/', auth, role('admin'), controller.crear);

// eliminar asignación
router.delete('/:id', auth, role('admin'), controller.eliminar);

module.exports = router;