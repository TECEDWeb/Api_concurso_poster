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
        const { rol } = req.query;

        const usuarios = await usuarioModel.listar({ rol });

        console.log('🟢 USUARIOS ENVIADOS:', usuarios);

        return res.json({
          ok: true,
          usuarios: Array.isArray(usuarios) ? usuarios : []
        });

      } catch (error) {
        console.error('🔴 Error al listar usuarios:', error);

        return res.status(500).json({
          ok: false,
          usuarios: []
        });
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
