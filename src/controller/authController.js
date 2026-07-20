const usuarioModel = require('../model/usuarioModel');
const authService = require('../services/authService');
const db = require('../config/db');
const { enviarCorreoRecuperacion } = require('../config/mailer');

const authController = {

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
  },

  async olvidePassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ ok: false, mensaje: 'El correo es obligatorio' });
      }

      const respuestaGenerica = {
        ok: true,
        mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación en unos minutos.'
      };

      const [usuarios] = await db.query(
        'SELECT id, nombre, email FROM usuarios WHERE email = ? LIMIT 1',
        [email.trim().toLowerCase()]
      );

      if (usuarios.length === 0) {
        return res.json(respuestaGenerica);
      }

      const usuario = usuarios[0];
      const token = authService.generarTokenReset();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.query(
        'INSERT INTO password_resets (usuario_id, token, expires_at) VALUES (?, ?, ?)',
        [usuario.id, token, expiresAt]
      );

      const enlace = `${process.env.FRONTEND_URL}/recuperar-password?token=${token}`;

      try {
        await enviarCorreoRecuperacion(usuario.email, usuario.nombre, enlace);
      } catch (mailError) {
        console.error('Error enviando correo de recuperación:', mailError);
      }

      return res.json(respuestaGenerica);

    } catch (error) {
      console.error('Error olvidePassword:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al procesar la solicitud' });
    }
  },

  async resetearPassword(req, res) {
    try {
      const { token, nuevaPassword } = req.body;

      if (!token || !nuevaPassword) {
        return res.status(400).json({ ok: false, mensaje: 'Token y nueva contraseña son obligatorios' });
      }

      if (nuevaPassword.length < 6) {
        return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const [resets] = await db.query(
        'SELECT * FROM password_resets WHERE token = ? AND used = 0 LIMIT 1',
        [token]
      );

      if (resets.length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'El enlace de recuperación no es válido o ya fue usado' });
      }

      const reset = resets[0];

      if (new Date(reset.expires_at) < new Date()) {
        return res.status(400).json({ ok: false, mensaje: 'El enlace de recuperación ha expirado. Solicita uno nuevo.' });
      }

      const passwordHash = await authService.hashPassword(nuevaPassword);

      await db.query(
        'UPDATE usuarios SET password_hash = ? WHERE id = ?',
        [passwordHash, reset.usuario_id]
      );

      await db.query(
        'UPDATE password_resets SET used = 1 WHERE id = ?',
        [reset.id]
      );

      return res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });

    } catch (error) {
      console.error('Error resetearPassword:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al restablecer la contraseña' });
    }
  }

};

module.exports = authController;