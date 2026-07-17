const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const controller = require('../controller/asignacionController');

console.log("✅ RUTAS DE ASIGNACION CARGADAS");

// ============================================
// 🔬 RUTA DE DIAGNÓSTICO (DEBE IR PRIMERO)
// ============================================
router.get('/diagnostico', auth, role('admin'), controller.diagnosticar);

// ============================================
// RUTAS PRINCIPALES
// ============================================

// Listar asignaciones
router.get('/', auth, role('admin'), controller.listar);

// Proyectos para el combo
router.get('/proyectos', auth, role('admin'), controller.proyectos);

// Evaluadores para el combo
router.get('/evaluadores', auth, role('admin'), controller.evaluadores);

// Crear asignación
router.post('/', auth, role('admin'), controller.crear);

// Eliminar asignación
router.delete('/:id', auth, role('admin'), controller.eliminar);

module.exports = router;