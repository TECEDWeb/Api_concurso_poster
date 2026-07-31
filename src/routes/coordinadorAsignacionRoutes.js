const express = require('express');
const router = express.Router();
const controller = require('../controller/coordinadorAsignacionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', roleMiddleware(['admin']), controller.listar);
router.get('/coordinadores', roleMiddleware(['admin']), controller.listarCoordinadores);
router.post('/', roleMiddleware(['admin']), controller.crear);
router.delete('/:id', roleMiddleware(['admin']), controller.eliminar);

module.exports = router;