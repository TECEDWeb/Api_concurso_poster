const concursoModel = require('../model/concursoModel');

const concursoController = {

  /**
   * LISTAR CONCURSOS
   */
  async listar(req, res) {
    try {
      console.log('📥 GET /concursos');
      const concursos = await concursoModel.listar();
      
      return res.json({
        ok: true,
        data: concursos
      });

    } catch (error) {
      console.error('❌ ERROR listar concursos:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al listar concursos'
      });
    }
  },

  /**
   * OBTENER CONCURSO POR ID
   */
  async obtenerPorId(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 GET /concursos/' + id);

      const concurso = await concursoModel.buscarPorId(id);

      if (!concurso) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Concurso no encontrado'
        });
      }

      return res.json({
        ok: true,
        data: concurso
      });

    } catch (error) {
      console.error('❌ ERROR obtener concurso:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener concurso'
      });
    }
  },

  /**
   * CREAR CONCURSO
   */
  async crear(req, res) {
    try {
      console.log('📥 POST /concursos', req.body);

      const { nombre, descripcion, tipo, fecha_inicio, fecha_fin, puntaje_maximo, activo } = req.body;

      // Validaciones
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre del concurso es obligatorio'
        });
      }

      const id = await concursoModel.crear({
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        tipo: tipo || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        puntaje_maximo: puntaje_maximo || null,
        activo: activo !== undefined ? activo : true
      });

      const concursoCreado = await concursoModel.buscarPorId(id);

      return res.status(201).json({
        ok: true,
        mensaje: 'Concurso creado correctamente',
        data: concursoCreado
      });

    } catch (error) {
      console.error('❌ ERROR crear concurso:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear concurso'
      });
    }
  },

  /**
   * ACTUALIZAR CONCURSO
   */
  async actualizar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 PUT /concursos/' + id, req.body);

      const { nombre, descripcion, tipo, fecha_inicio, fecha_fin, puntaje_maximo, activo } = req.body;

      // Verificar si existe
      const existe = await concursoModel.buscarPorId(id);
      if (!existe) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Concurso no encontrado'
        });
      }

      // Validaciones
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre del concurso es obligatorio'
        });
      }

      await concursoModel.actualizar(id, {
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        tipo: tipo || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        puntaje_maximo: puntaje_maximo || null,
        activo: activo !== undefined ? activo : true
      });

      const concursoActualizado = await concursoModel.buscarPorId(id);

      return res.json({
        ok: true,
        mensaje: 'Concurso actualizado correctamente',
        data: concursoActualizado
      });

    } catch (error) {
      console.error('❌ ERROR actualizar concurso:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar concurso'
      });
    }
  },

  /**
   * ELIMINAR CONCURSO
   */
  async eliminar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 DELETE /concursos/' + id);

      // Verificar si existe
      const existe = await concursoModel.buscarPorId(id);
      if (!existe) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Concurso no encontrado'
        });
      }

      await concursoModel.eliminar(id);

      return res.json({
        ok: true,
        mensaje: 'Concurso eliminado correctamente'
      });

    } catch (error) {
      console.error('❌ ERROR eliminar concurso:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar concurso'
      });
    }
  }
};

module.exports = concursoController;