const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const usuarioController = require('../controller/usuarioController');

console.log('======================================');
console.log('usuarioRoutes.js CARGADO');
console.log('======================================');

router.get('/ping', (req, res) => {
  console.log('PING usuarios');
  res.json({
    ok: true,
    mensaje: 'usuarioRoutes funcionando correctamente'
  });
});

router.get('/', authMiddleware, roleMiddleware('admin'), usuarioController.listar);
router.get('/evaluadores', authMiddleware, roleMiddleware('admin'), usuarioController.getEvaluadores);
router.get('/:id', authMiddleware, roleMiddleware('admin'), usuarioController.getById);
router.post('/', authMiddleware, roleMiddleware('admin'), usuarioController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), usuarioController.actualizar);
router.put('/:id/estado', authMiddleware, roleMiddleware('admin'), usuarioController.toggleActivo);
router.patch('/:id/estado', authMiddleware, roleMiddleware('admin'), usuarioController.toggleActivo);
router.post('/:id/reset-password', authMiddleware, roleMiddleware('admin'), usuarioController.resetPassword);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), usuarioController.eliminar);

router.get('/ejemplo-multi-rol', authMiddleware, roleMiddleware('admin', 'evaluador'), (req, res) => {
  console.log('GET /api/usuarios/ejemplo-multi-rol');
  res.json({
    ok: true,
    mensaje: `Hola ${req.usuario.nombre}, tu rol es ${req.usuario.rol}`
  });
});

router.post('/:id/toggle-estado', authMiddleware, roleMiddleware('admin'), usuarioController.toggleActivo);

module.exports = router;