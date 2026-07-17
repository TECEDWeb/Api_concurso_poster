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

  /**
   * Body esperado: { nombre, descripcion, concursoId, nivel, area, activo,
   *                   participantes: string[], tutores: string[] }
   * participantes y tutores son arrays de nombres, tal como los arma
   * el frontend a partir del texto separado por comas.
   */
  async create(req, res) {
    try {
      const { nombre, descripcion, concursoId, nivel, area, activo, participantes, tutores } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del proyecto es obligatorio' });
      }

      if (!Array.isArray(participantes) || participantes.filter(p => p && p.trim()).length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'Debe registrar al menos un participante' });
      }

      const tutoresValidos = Array.isArray(tutores) ? tutores.filter(t => t && t.trim()) : [];
      if (tutoresValidos.length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'Debe registrar al menos el tutor encargado' });
      }
      if (tutoresValidos.length > 4) {
        return res.status(400).json({ ok: false, mensaje: 'Máximo 4 tutores por proyecto' });
      }

      const proyecto = await ProyectoService.create({
        concurso_id: concursoId || null,
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        nivel: nivel || null,
        area: area || null,
        activo: activo !== undefined ? activo : true,
        participantes,
        tutores
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
      const { nombre, descripcion, concursoId, nivel, area, activo, participantes, tutores } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del proyecto es obligatorio' });
      }

      const existente = await ProyectoService.getById(id);
      if (!existente) {
        return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado' });
      }

      if (tutores && Array.isArray(tutores) && tutores.filter(t => t && t.trim()).length > 4) {
        return res.status(400).json({ ok: false, mensaje: 'Máximo 4 tutores por proyecto' });
      }

      await ProyectoService.update(id, {
        concurso_id: concursoId !== undefined ? concursoId : existente.concurso_id,
        nombre: nombre.trim(),
        descripcion: descripcion !== undefined ? descripcion : existente.descripcion,
        nivel: nivel !== undefined ? nivel : existente.nivel,
        area: area !== undefined ? area : existente.area,
        activo: activo !== undefined ? activo : existente.activo,
        participantes,
        tutores
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

      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
        return res.status(409).json({
          ok: false,
          mensaje: 'No se puede eliminar este proyecto porque ya tiene evaluadores asignados o evaluaciones registradas. Elimina primero esas asignaciones desde la sección "Asignaciones".'
        });
      }

      return res.status(500).json({ ok: false, mensaje: 'Error al eliminar proyecto: ' + error.message });
    }
  }
};

module.exports = proyectoController;