const express = require('express');
const router = express.Router();

const authController = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.registrar);
router.post('/olvide-password', authController.olvidePassword);
router.post('/resetear-password', authController.resetearPassword);

router.get('/perfil', authMiddleware, authController.perfil);

module.exports = router;