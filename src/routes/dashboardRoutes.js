const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get(
  '/admin',

  authMiddleware,

  (req, res, next) => {
    console.log('🟡 PASÓ authMiddleware');
    console.log('Usuario:', req.usuario);
    next();
  },

  roleMiddleware('admin'),

  (req, res, next) => {
    console.log('🟢 PASÓ roleMiddleware');
    next();
  },

  dashboardController.adminDashboard
);

module.exports = router;