const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const usuarioModel = require('../model/usuarioModel');

console.log('======================================');
console.log('✅ usuarioRoutes.js CARGADO');
console.log('======================================');

// ==============================
// PRUEBA
// ==============================
router.get('/ping', (req, res) => {

  console.log('🏓 PING usuarios');

  res.json({
    ok: true,
    mensaje: 'usuarioRoutes funcionando correctamente'
  });

});

// ==============================
// LISTAR USUARIOS
// ==============================
router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  async (req, res) => {

    console.log('📥 GET /api/usuarios');

    try {

      const { rol } = req.query;

      console.log('Rol solicitado:', rol);

      const usuarios = await usuarioModel.listar({ rol });

      console.log('Usuarios encontrados:', usuarios.length);

      return res.json({
        ok: true,
        usuarios: Array.isArray(usuarios) ? usuarios : []
      });

    } catch (error) {

      console.error('❌ Error listando usuarios');
      console.error(error);

      return res.status(500).json({
        ok: false,
        usuarios: []
      });

    }

  }
);

// ==============================
// EJEMPLO MULTIROL
// ==============================
router.get(
  '/ejemplo-multi-rol',
  authMiddleware,
  roleMiddleware('admin', 'evaluador'),
  (req, res) => {

    console.log('📥 GET /api/usuarios/ejemplo-multi-rol');

    res.json({
      ok: true,
      mensaje: `Hola ${req.usuario.nombre}, tu rol es ${req.usuario.rol}`
    });

  }
);

// ==============================
// LISTAR EVALUADORES
// ==============================
router.get(
  '/evaluadores',
  authMiddleware,
  roleMiddleware('admin'),
  async (req, res) => {

    console.log('======================================');
    console.log('📥 GET /api/usuarios/evaluadores');
    console.log('Usuario autenticado:', req.usuario);
    console.log('======================================');

    try {

      const evaluadores = await usuarioModel.listar({
        rol: 'evaluador'
      });

      console.log(`✅ Evaluadores encontrados: ${evaluadores.length}`);

      return res.json({
        ok: true,
        data: evaluadores
      });

    } catch (error) {

      console.error('❌ ERROR EN /usuarios/evaluadores');
      console.error(error);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error obteniendo evaluadores'
      });

    }

  }
);

module.exports = router;