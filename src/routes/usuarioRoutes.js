const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const usuarioController = require('../controller/usuarioController');

console.log('======================================');
console.log('✅ usuarioRoutes.js CARGADO');
console.log('======================================');

// ==============================
// PRUEBA
// ==============================
router.get('/ping', (req, res) => {
  console.log('🏓 PING usuarios');
  res.json({
    ok: true,
    mensaje: 'usuarioRoutes funcionando correctamente'
  });
});

// ==============================
// LISTAR USUARIOS
// ==============================
router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.listar
);

// ==============================
// LISTAR EVALUADORES
// ==============================
router.get(
  '/evaluadores',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.getEvaluadores
);

// ==============================
// OBTENER USUARIO POR ID
// ==============================
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.getById
);

// ==============================
// CREAR USUARIO
// ==============================
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.create
);

// ==============================
// ACTUALIZAR USUARIO (PUT)
// ==============================
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.actualizar
);

// ==============================
// CAMBIAR ESTADO - PUT (para frontend)
// ==============================
router.put(
  '/:id/estado',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.toggleActivo
);

// ==============================
// CAMBIAR ESTADO - PATCH (alternativa REST)
// ==============================
router.patch(
  '/:id/estado',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.toggleActivo
);

// ==============================
// RESETEAR CONTRASEÑA
// ==============================
router.post(
  '/:id/reset-password',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.resetPassword
);

// ==============================
// ELIMINAR USUARIO
// ==============================
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.eliminar
);

// ==============================
// EJEMPLO MULTIROL
// ==============================
router.get(
  '/ejemplo-multi-rol',
  authMiddleware,
  roleMiddleware('admin', 'evaluador'),
  (req, res) => {
    console.log('📥 GET /api/usuarios/ejemplo-multi-rol');
    res.json({
      ok: true,
      mensaje: `Hola ${req.usuario.nombre}, tu rol es ${req.usuario.rol}`
    });
  }
);

// ==============================
// CAMBIAR ESTADO - POST (alternativa)
// ==============================
router.post(
  '/:id/toggle-estado',
  authMiddleware,
  roleMiddleware('admin'),
  usuarioController.toggleActivo
);

module.exports = router;