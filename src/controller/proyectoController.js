const ProyectoService = require('../services/proyectoService');

const proyectoController = {

  async getAll(req, res) {
    try {
      const proyectos = await ProyectoService.getAll();
      return res.json({ ok: true, data: proyectos });
    } catch (error) {
      console.error('❌ ERROR get proyectos:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al obtener proyectos: ' + error.message });
    }
  },

  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const proyecto = await ProyectoService.getById(id);

      if (!proyecto) {
        return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado' });
      }

      return res.json({ ok: true, data: proyecto });
    } catch (error) {
      console.error('❌ ERROR get proyecto:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al obtener proyecto: ' + error.message });
    }
  },

  async create(req, res) {
    try {
      const { nombre, descripcion, concursoId, estudiante_nombre, nivel, area, activo } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del proyecto es obligatorio' });
      }

      if (!estudiante_nombre || estudiante_nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del estudiante es obligatorio' });
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

      return res.status(201).json({ ok: true, mensaje: 'Proyecto creado correctamente', data: proyecto });

    } catch (error) {
      console.error('❌ ERROR CREATE PROYECTO:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al crear proyecto: ' + error.message });
    }
  },

  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { nombre, descripcion, concursoId, estudiante_nombre, nivel, area, activo } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del proyecto es obligatorio' });
      }

      const existente = await ProyectoService.getById(id);
      if (!existente) {
        return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado' });
      }

      await ProyectoService.update(id, {
        concurso_id: concursoId !== undefined ? concursoId : existente.concurso_id,
        nombre: nombre.trim(),
        descripcion: descripcion !== undefined ? descripcion : existente.descripcion,
        estudiante_nombre: estudiante_nombre || existente.estudiante_nombre,
        nivel: nivel !== undefined ? nivel : existente.nivel,
        area: area !== undefined ? area : existente.area,
        activo: activo !== undefined ? activo : existente.activo
      });

      const proyectoActualizado = await ProyectoService.getById(id);

      return res.json({ ok: true, mensaje: 'Proyecto actualizado correctamente', data: proyectoActualizado });

    } catch (error) {
      console.error('❌ ERROR UPDATE PROYECTO:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al actualizar proyecto: ' + error.message });
    }
  },

  async remove(req, res) {
    try {
      const id = parseInt(req.params.id);

      const existente = await ProyectoService.getById(id);
      if (!existente) {
        return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado' });
      }

      await ProyectoService.delete(id);

      return res.json({ ok: true, mensaje: 'Proyecto eliminado correctamente' });

    } catch (error) {
      console.error('❌ ERROR DELETE PROYECTO:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al eliminar proyecto: ' + error.message });
    }
  }
};

module.exports = proyectoController;