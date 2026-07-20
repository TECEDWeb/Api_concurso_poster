const db = require('../config/db');
const usuarioModel = require('../model/usuarioModel');
const bcrypt = require('bcrypt');

const usuarioController = {

  async listar(req, res) {
    try {
      const { rol } = req.query;
      const usuarios = await usuarioModel.listar({ rol });

      return res.json({
        ok: true,
        usuarios: Array.isArray(usuarios) ? usuarios : []
      });
    } catch (err) {
      console.error('ERROR listar usuarios:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al listar usuarios'
      });
    }
  },

  async getEvaluadores(req, res) {
    try {
      console.log('GET EVALUADORES');
      const evaluadores = await usuarioModel.getEvaluadores();

      return res.json({
        ok: true,
        data: evaluadores
      });
    } catch (err) {
      console.error('ERROR getEvaluadores:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener evaluadores'
      });
    }
  },

  async create(req, res) {
    try {
      console.log('CREATE USUARIO:', req.body);

      const { cedula, nombre, email, telefono, password, rol, departamento } = req.body;

      if (!cedula || !nombre || !password || !rol) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Faltan campos obligatorios: cedula, nombre, password, rol'
        });
      }

      const existe = await usuarioModel.buscarPorCedula(cedula);
      if (existe) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Ya existe un usuario con esta cédula'
        });
      }

      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      const id = await usuarioModel.crear({
        cedula,
        nombre,
        email,
        telefono,
        password_hash,
        rol,
        departamento
      });

      return res.json({
        ok: true,
        mensaje: 'Usuario creado correctamente',
        data: {
          id,
          cedula,
          nombre,
          email,
          rol
        }
      });
    } catch (err) {
      console.error('ERROR create usuario:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear usuario'
      });
    }
  },

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { cedula, nombre, email, telefono, rol, departamento, activo, password } = req.body;

      console.log('ACTUALIZAR USUARIO ID:', id);

      const usuarioExistente = await usuarioModel.buscarPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      if (cedula && cedula !== usuarioExistente.cedula) {
        const existe = await usuarioModel.buscarPorCedula(cedula);
        if (existe) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Ya existe un usuario con esta cédula'
          });
        }
      }

      let password_hash = null;
      if (password && password.trim() !== '') {
        const saltRounds = 10;
        password_hash = await bcrypt.hash(password, saltRounds);
      }

      const actualizado = await usuarioModel.actualizar(id, {
        cedula: cedula || usuarioExistente.cedula,
        nombre: nombre || usuarioExistente.nombre,
        email: email !== undefined ? email : usuarioExistente.email,
        telefono: telefono !== undefined ? telefono : usuarioExistente.telefono,
        rol: rol || usuarioExistente.rol,
        departamento: departamento !== undefined ? departamento : usuarioExistente.departamento,
        activo: activo !== undefined ? activo : usuarioExistente.activo,
        password_hash
      });

      if (!actualizado) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No se pudo actualizar el usuario'
        });
      }

      const usuarioActualizado = await usuarioModel.buscarPorId(id);

      return res.json({
        ok: true,
        mensaje: 'Usuario actualizado correctamente',
        data: usuarioActualizado
      });
    } catch (err) {
      console.error('ERROR actualizar usuario:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar usuario'
      });
    }
  },

  async toggleActivo(req, res) {
    try {
      const { id } = req.params;
      console.log('Cambiando estado del usuario ID:', id);

      const usuarioExistente = await usuarioModel.buscarPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      const actualizado = await usuarioModel.toggleActivo(id);

      if (!actualizado) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No se pudo actualizar el estado'
        });
      }

      const usuarioActualizado = await usuarioModel.buscarPorId(id);

      return res.json({
        ok: true,
        mensaje: `Usuario ${usuarioActualizado.activo ? 'activado' : 'desactivado'} correctamente`,
        data: {
          id: usuarioActualizado.id,
          nombre: usuarioActualizado.nombre,
          activo: usuarioActualizado.activo
        }
      });
    } catch (err) {
      console.error('ERROR toggleActivo:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar estado'
      });
    }
  },

  async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { nuevaPassword } = req.body;

      const usuarioExistente = await usuarioModel.buscarPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      let passwordFinal = nuevaPassword;

      if (passwordFinal) {
        if (passwordFinal.length < 6) {
          return res.status(400).json({
            ok: false,
            mensaje: 'La contraseña debe tener al menos 6 caracteres'
          });
        }
      } else {
        const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        passwordFinal = Array.from({ length: 10 }, () =>
          alfabeto[Math.floor(Math.random() * alfabeto.length)]
        ).join('');
      }

      const saltRounds = 10;
      const password_hash = await bcrypt.hash(passwordFinal, saltRounds);

      const resetado = await usuarioModel.resetPassword(id, password_hash);

      if (!resetado) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No se pudo resetear la contraseña'
        });
      }

      return res.json({
        ok: true,
        mensaje: 'Contraseña reseteada correctamente',
        data: {
          nuevaPassword: passwordFinal
        }
      });
    } catch (err) {
      console.error('ERROR resetPassword:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al resetear contraseña'
      });
    }
  },

  async eliminar(req, res) {
    try {
      const { id } = req.params;

      const usuarioExistente = await usuarioModel.buscarPorId(id);
      if (!usuarioExistente) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      if (id == req.usuario.id) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No puedes eliminar tu propio usuario'
        });
      }

      const eliminado = await usuarioModel.eliminar(id);

      if (!eliminado) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No se pudo eliminar el usuario'
        });
      }

      return res.json({
        ok: true,
        mensaje: 'Usuario eliminado correctamente'
      });
    } catch (err) {
      console.error('ERROR eliminar usuario:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar usuario'
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;

      const usuario = await usuarioModel.buscarPorId(id);

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
    } catch (err) {
      console.error('ERROR getById:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener usuario'
      });
    }
  }
};

module.exports = usuarioController;