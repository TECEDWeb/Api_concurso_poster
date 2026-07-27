const express = require('express');
const router = express.Router();
const logsController = require('../controller/logsController');
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación y rol admin
router.use(verificarToken);
router.use(verificarAdmin);

// Obtener logs recientes
router.get('/recientes', logsController.obtenerRecientes);

// Obtener logs del dashboard
router.get('/dashboard', logsController.obtenerDashboard);

// Obtener logs con filtros
router.get('/', logsController.obtenerConFiltros);

// Contar no leídos
router.get('/contar-no-leidos', logsController.contarNoLeidos);

module.exports = router;