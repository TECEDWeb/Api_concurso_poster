const express = require('express');

const router = express.Router();

const controller = require('../controller/reporteController');


router.get(
'/stats',
controller.stats
);


router.get(
'/ranking',
controller.ranking
);


router.get(
'/proyectos',
controller.proyectos
);



module.exports = router;