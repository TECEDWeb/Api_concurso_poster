const express = require('express');
const router = express.Router();
const controller = require('../controller/certificadoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Público — sin auth
router.get('/validar/:codigo', controller.validarPublico);

// Usuario autenticado (cualquier rol) — ve solo los suyos
router.get('/mios', authMiddleware, controller.misCertificados);

// Admin
router.get('/', authMiddleware, roleMiddleware('admin'), controller.getAll);
router.post('/generar', authMiddleware, roleMiddleware('admin'), controller.generar);
router.get('/:id/pdf', authMiddleware, controller.descargarPdf);
router.get('/:id', authMiddleware, roleMiddleware('admin'), controller.obtener);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), controller.eliminar);

module.exports = router;