const express = require('express');
const router = express.Router();

const authController = require('../controller/authController');
// ✅ IMPORTACIÓN CORRECTA - authMiddleware es una función
const authMiddleware = require('../middleware/authMiddleware');

// Público: cualquiera puede intentar iniciar sesión.
router.post('/login', authController.login);
router.post('/register', authController.registrar);
router.post('/olvide-password', authController.olvidePassword);
router.post('/resetear-password', authController.resetearPassword);

// Protegido: requiere token válido
router.get('/perfil', authMiddleware, authController.perfil);

module.exports = router;