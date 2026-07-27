const express = require('express');
const router = express.Router();
const LogsService = require('../services/logsService');

// ✅ IMPORTAR MIDDLEWARES CORRECTAMENTE
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');

// ============================================
// ✅ APLICAR MIDDLEWARES - CORREGIDO
// ============================================
// router.use() requiere funciones, no objetos
router.use(verificarToken);
router.use(verificarAdmin);

/**
 * GET /api/logs/recientes
 * Obtener logs recientes (últimos 10 por defecto)
 * Query: ?limite=5
 */
router.get('/recientes', async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;
    const logs = await LogsService.obtenerRecientes(limite);
    return res.json({ ok: true, data: logs });
  } catch (error) {
    console.error('Error obteniendo logs recientes:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener logs' });
  }
});

/**
 * GET /api/logs/dashboard
 * Obtener logs para el dashboard (últimos 5)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const logs = await LogsService.obtenerDashboard();
    return res.json({ ok: true, data: logs });
  } catch (error) {
    console.error('Error obteniendo logs del dashboard:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener logs' });
  }
});

/**
 * GET /api/logs/contar-no-leidos
 * Contar logs del día (para notificaciones)
 */
router.get('/contar-no-leidos', async (req, res) => {
  try {
    const count = await LogsService.contarNoLeidos();
    return res.json({ ok: true, data: { total: count } });
  } catch (error) {
    console.error('Error contando logs:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al contar logs' });
  }
});

module.exports = router;