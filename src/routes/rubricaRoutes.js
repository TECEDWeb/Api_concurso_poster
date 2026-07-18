const express = require('express');
const router = express.Router();
const RubricaController = require('../controller/rubricaController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware('admin'), RubricaController.listar);
router.get('/:id', authMiddleware, roleMiddleware('admin'), RubricaController.obtener);
router.post('/', authMiddleware, roleMiddleware('admin'), RubricaController.crear);
router.put('/:id', authMiddleware, roleMiddleware('admin'), RubricaController.actualizar);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), RubricaController.eliminar);
router.get('/:id/exportar', authMiddleware, roleMiddleware('admin'), RubricaController.exportar);

module.exports = router;