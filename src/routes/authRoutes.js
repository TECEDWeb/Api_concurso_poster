const express = require('express');
const router = express.Router();

const authController = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Público: cualquiera puede intentar iniciar sesión.
router.post('/login', authController.login);
router.post('/register', authController.registrar);

// Protegido: requiere token válido. Sirve para que el frontend
// confirme la sesión activa y obtenga los datos del usuario.
router.get('/perfil', authMiddleware, authController.perfil);

// Recuperación de contraseña — públicas, sin autenticación
router.post('/olvide-password', authController.olvidePassword);
router.post('/resetear-password', authController.resetearPassword);

module.exports = router;