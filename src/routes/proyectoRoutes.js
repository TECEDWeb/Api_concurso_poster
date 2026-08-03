const express = require('express');
const router = express.Router();
const controller = require('../controller/proyectoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

console.log('======================================');
console.log('proyectoRoutes.js CARGADO');
console.log('======================================');

router.get('/', authMiddleware, roleMiddleware(['admin', 'coordinador']), controller.getAll);
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'coordinador']), controller.getById);

// Escritura: solo admin
router.post('/', authMiddleware, roleMiddleware('admin'), controller.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), controller.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), controller.remove);

module.exports = router;