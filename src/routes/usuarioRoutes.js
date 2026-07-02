const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const usuarioModel = require('../model/usuarioModel');

// Solo administradores pueden listar todos los usuarios del sistema.
router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  async (req, res) => {
    try {
      const { rol } = req.query; // permite filtrar ?rol=evaluador
      const usuarios = await usuarioModel.listar({ rol });
      res.json({ ok: true, usuarios });
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
  }
);

// Tanto administradores como evaluadores pueden ver esta ruta de ejemplo.
router.get(
  '/ejemplo-multi-rol',
  authMiddleware,
  roleMiddleware('admin', 'evaluador'),
  (req, res) => {
    res.json({ ok: true, mensaje: `Hola ${req.usuario.nombre}, tu rol es ${req.usuario.rol}` });
  }
);

module.exports = router;
