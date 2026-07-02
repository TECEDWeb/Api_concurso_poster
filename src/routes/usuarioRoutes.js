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
      console.log('🟢 ENTRÓ A /api/usuarios');
      console.log('Usuario autenticado:', req.usuario);
      try {
        const { rol } = req.query;
        console.log('Filtro rol:', rol);
        const usuarios = await usuarioModel.listar({ rol });
        console.log('Usuarios encontrados:', usuarios.length);
        res.json({
          ok: true,
          usuarios
        });

      } catch (error) {
        console.log('🔴 ERROR EN LISTAR USUARIOS');
        console.log(error);
        res.status(500).json({
          ok:false,
          mensaje:'Error interno'
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
