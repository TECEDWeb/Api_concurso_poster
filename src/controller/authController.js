const usuarioModel = require('../model/usuarioModel');
const authService = require('../services/authService');

const authController = {
  /**
   * POST /api/auth/login
   * Body esperado: { cedula: string, password: string }
   *
   * El login es por cédula (no por email), porque la cédula
   * es el identificador único tanto de administradores como
   * de evaluadores en este sistema.
   */

  async registrar(req, res) {
    try {
      const { cedula, nombre, email, password, rol, departamento } = req.body;

      if (!cedula || !password || !rol) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Datos incompletos'
        });
      }

      const existe = await usuarioModel.buscarPorCedula(cedula);
      if (existe) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El usuario ya existe'
        });
      }

      const password_hash = await authService.hashPassword(password);

      const nuevoUsuario = await usuarioModel.crear({
        cedula,
        nombre,
        email,
        password_hash,
        rol,
        departamento
      });

      return res.json({
        ok: true,
        usuario: nuevoUsuario
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear usuario'
      });
    }
  },
  async login(req, res) {
    try {
      const { cedula, password } = req.body;

      if (!cedula || !password) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Cédula y contraseña son obligatorias.',
        });
      }

      const usuario = await usuarioModel.buscarPorCedula(cedula);

      if (!usuario) {
        // Mensaje genérico: no revelamos si fue la cédula o la contraseña
        // lo que falló, para no facilitar enumeración de usuarios.
        return res.status(401).json({
          ok: false,
          mensaje: 'Cédula o contraseña incorrectos.',
        });
      }

      if (!usuario.activo) {
        return res.status(403).json({
          ok: false,
          mensaje: 'Este usuario está inactivo. Contacta al administrador.',
        });
      }

      const passwordValida = await authService.compararPassword(
        password,
        usuario.password_hash
      );

      if (!passwordValida) {
        return res.status(401).json({
          ok: false,
          mensaje: 'Cédula o contraseña incorrectos.',
        });
      }

      const token = authService.generarToken(usuario);

      // Nunca devolvemos password_hash en la respuesta.
      return res.json({
        ok: true,
        token,
        usuario: {
          id: usuario.id,
          cedula: usuario.cedula,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          departamento: usuario.departamento,
        },
      });
    } catch (error) {
      console.error('Error en authController.login:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error interno del servidor al iniciar sesión.',
      });
    }
  },

  /**
   * GET /api/auth/perfil
   * Requiere authMiddleware. Devuelve los datos del usuario autenticado
   * a partir del token, útil para que el frontend valide la sesión
   * al recargar la app sin tener que volver a pedir credenciales.
   */
  async perfil(req, res) {
    try {
      const usuario = await usuarioModel.buscarPorId(req.usuario.id);

      if (!usuario) {
        return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
      }

      return res.json({ ok: true, usuario });
    } catch (error) {
      console.error('Error en authController.perfil:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error interno del servidor al obtener el perfil.',
      });
    }
  },
};

module.exports = authController;
