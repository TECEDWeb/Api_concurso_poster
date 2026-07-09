const ProyectoService = require('../services/proyectoService');

const proyectoController = {

  // =========================
  // GET ALL
  // =========================
  async getAll(req, res) {
    try {
      console.log('📥 GET /proyectos');
      const proyectos = await ProyectoService.getAll();

      return res.json({
        ok: true,
        data: proyectos
      });

    } catch (error) {
      console.error('❌ ERROR get proyectos:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener proyectos: ' + error.message
      });
    }
  },

  // =========================
  // GET BY ID
  // =========================
  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 GET /proyectos/' + id);

      const proyecto = await ProyectoService.getById(id);

      if (!proyecto) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Proyecto no encontrado'
        });
      }

      return res.json({
        ok: true,
        data: proyecto
      });

    } catch (error) {
      console.error('❌ ERROR get proyecto:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener proyecto: ' + error.message
      });
    }
  },

  // =========================
  // CREATE
  // =========================
  async create(req, res) {
    try {
      console.log('==============================');
      console.log('📥 CREATE PROYECTO');
      console.log('BODY:', req.body);
      console.log('==============================');

      const { nombre, descripcion, concursoId, estudiante_nombre, nivel, area, activo } = req.body;

      // Validar que tenga nombre
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre del proyecto es obligatorio'
        });
      }

      // Validar que tenga estudiante_nombre
      if (!estudiante_nombre || estudiante_nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre del estudiante es obligatorio'
        });
      }

      const proyecto = await ProyectoService.create({
        concurso_id: concursoId || null,
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        estudiante_nombre: estudiante_nombre.trim(),
        nivel: nivel || null,
        area: area || null,
        activo: activo !== undefined ? activo : true
      });

      return res.status(201).json({
        ok: true,
        mensaje: 'Proyecto creado correctamente',
        data: proyecto
      });

    } catch (error) {
      console.error('❌ ERROR CREATE PROYECTO:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear proyecto: ' + error.message
      });
    }
  },

  // =========================
  // UPDATE
  // =========================
  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 UPDATE PROYECTO ID:', id);
      console.log('BODY:', req.body);

      const { nombre, descripcion, concursoId, estudiante_nombre, activo } = req.body;

      // Validar que tenga nombre
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre del proyecto es obligatorio'
        });
      }

      // Verificar si existe
      const existente = await ProyectoService.getById(id);
      if (!existente) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Proyecto no encontrado'
        });
      }

      await ProyectoService.update(id, {
        concurso_id: concursoId || existente.concurso_id,
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        estudiante_nombre: estudiante_nombre || existente.estudiante_nombre,
        activo: activo !== undefined ? activo : existente.activo
      });

      const proyectoActualizado = await ProyectoService.getById(id);

      return res.json({
        ok: true,
        mensaje: 'Proyecto actualizado correctamente',
        data: proyectoActualizado
      });

    } catch (error) {
      console.error('❌ ERROR UPDATE PROYECTO:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar proyecto: ' + error.message
      });
    }
  },

  // =========================
  // DELETE
  // =========================
  async remove(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('📥 DELETE /proyectos/' + id);

      // Verificar si existe
      const existente = await ProyectoService.getById(id);
      if (!existente) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Proyecto no encontrado'
        });
      }

      await ProyectoService.delete(id);

      return res.json({
        ok: true,
        mensaje: 'Proyecto eliminado correctamente'
      });

    } catch (error) {
      console.error('❌ ERROR DELETE PROYECTO:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar proyecto: ' + error.message
      });
    }
  }
};

module.exports = proyectoController;