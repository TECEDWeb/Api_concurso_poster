const express = require('express');
const router = express.Router();
const controller = require('../controller/seccionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware('admin'), controller.getAll);
router.post('/', authMiddleware, roleMiddleware('admin'), controller.create);
router.put('/reordenar', authMiddleware, roleMiddleware('admin'), controller.reordenar);
router.put('/:id', authMiddleware, roleMiddleware('admin'), controller.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), controller.delete);

module.exports = router;