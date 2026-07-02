const usuarioModel = require('../model/usuarioModel');
const authService = require('../services/authService');

const authController = {

  /**
   * POST /api/auth/registrar
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

      const nuevoUsuarioId = await usuarioModel.crear({
        cedula,
        nombre,
        email,
        password_hash,
        rol,
        departamento
      });

      return res.json({
        ok: true,
        mensaje: 'Usuario creado correctamente',
        data: {
          id: nuevoUsuarioId,
          cedula,
          nombre,
          email,
          rol,
          departamento
        }
      });

    } catch (error) {
      console.error('Error registrar:', error);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear usuario'
      });
    }
  },


  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { cedula, password } = req.body;

      if (!cedula || !password) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Cédula y contraseña son obligatorias'
        });
      }

      const usuario = await usuarioModel.buscarPorCedula(cedula);

      if (!usuario) {
        return res.status(401).json({
          ok: false,
          mensaje: 'Cédula o contraseña incorrectos'
        });
      }

      if (!usuario.activo) {
        return res.status(403).json({
          ok: false,
          mensaje: 'Usuario inactivo'
        });
      }

      const passwordValida = await authService.compararPassword(
        password,
        usuario.password_hash
      );

      if (!passwordValida) {
        return res.status(401).json({
          ok: false,
          mensaje: 'Cédula o contraseña incorrectos'
        });
      }

      const token = authService.generarToken(usuario);

      return res.json({
        ok: true,
        data: {
          token,
          usuario: {
            id: usuario.id,
            cedula: usuario.cedula,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            departamento: usuario.departamento
          }
        }
      });

    } catch (error) {
      console.error('Error login:', error);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error interno del servidor'
      });
    }
  },


  /**
   * GET /api/auth/perfil
   */
  async perfil(req, res) {
    try {
      const usuario = await usuarioModel.buscarPorId(req.usuario.id);

      if (!usuario) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      return res.json({
        ok: true,
        data: usuario
      });

    } catch (error) {
      console.error('Error perfil:', error);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener perfil'
      });
    }
  }

};

module.exports = authController;