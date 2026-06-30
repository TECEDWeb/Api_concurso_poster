const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/admin', authMiddleware, roleMiddleware('administrador'), dashboardController.adminDashboard);

module.exports = router;