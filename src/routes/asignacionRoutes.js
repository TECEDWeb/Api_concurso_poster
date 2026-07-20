const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const controller = require('../controller/asignacionController');

console.log("RUTAS DE ASIGNACION CARGADAS");
router.get('/diagnostico', auth, role('admin'), controller.diagnosticar);
router.get('/', auth, role('admin'), controller.listar);
router.get('/proyectos', auth, role('admin'), controller.proyectos);
router.get('/evaluadores', auth, role('admin'), controller.evaluadores);
router.post('/', auth, role('admin'), controller.crear);
router.delete('/:id', auth, role('admin'), controller.eliminar);

module.exports = router;