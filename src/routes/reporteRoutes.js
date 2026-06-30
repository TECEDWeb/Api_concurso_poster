const express = require('express');
const router = express.Router();
const controller = require('../controller/reporteController');

router.get('/stats', controller.stats);
router.get('/ranking', controller.ranking);

module.exports = router;