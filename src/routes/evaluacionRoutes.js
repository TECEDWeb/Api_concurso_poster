const express = require('express');
const router = express.Router();
const evaluacionController = require('../controller/evaluacionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware('admin'), evaluacionController.getAll);
router.get('/reporte-admin', authMiddleware, roleMiddleware('admin'), evaluacionController.getReporteAdmin);
router.get('/asignados', authMiddleware, evaluacionController.getAsignados);
router.get('/mis-resultados', authMiddleware, evaluacionController.getMisResultados);
router.get('/resumen', authMiddleware, evaluacionController.getResumen);
router.get('/:id/formulario', authMiddleware, evaluacionController.getFormulario);
router.get('/:id/editar', authMiddleware, evaluacionController.getEvaluacionParaEditar);

router.post('/asignar', authMiddleware, roleMiddleware('admin'), evaluacionController.asignar);
router.post('/:id/guardar', authMiddleware, evaluacionController.guardar);
router.put('/:id/actualizar', authMiddleware, evaluacionController.actualizarEvaluacion);
router.post('/:id/finalizar', authMiddleware, evaluacionController.finalizarEvaluacion);

router.put('/:id/reabrir', authMiddleware, roleMiddleware('admin'), evaluacionController.reabrirEvaluacion);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), evaluacionController.eliminarEvaluacion);

router.get('/:id', authMiddleware, roleMiddleware('admin'), evaluacionController.getById);
router.post('/', authMiddleware, roleMiddleware('admin'), evaluacionController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), evaluacionController.update);

module.exports = router;