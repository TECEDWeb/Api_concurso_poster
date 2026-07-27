const ProyectoService = require('../services/proyectoService');
const LogsService = require('../services/logsService');

const proyectoController = {

  async getAll(req, res) {
    try {
      const proyectos = await ProyectoService.getAll();
      return res.json({ ok: true, data: proyectos });
    } catch (error) {
      console.error('ERROR get proyectos:', error);
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
      console.error('ERROR get proyecto:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al obtener proyecto: ' + error.message });
    }
  },

  // ✅ ACTUALIZADO: participantes opcionales, agregado codigoProyecto
  async create(req, res) {
    try {
      const { 
        nombre, 
        descripcion, 
        concursoId, 
        nivel, 
        area, 
        activo, 
        codigoProyecto,
        participantes = [], 
        tutores = [] 
      } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del proyecto es obligatorio' });
      }

      const tutoresValidos = Array.isArray(tutores) ? tutores.filter(t => t && t.trim()) : [];
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
        codigo_proyecto: codigoProyecto || null,
        participantes: participantes || [],
        tutores: tutores || []
      });

      // ✅ LOG: Proyecto creado
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'proyecto',
          accion: 'crear',
          entidad_id: proyecto?.id || null,
          entidad_nombre: nombre.trim(),
          descripcion: `Se creó el proyecto "${nombre.trim()}" en el área "${area || 'Sin área'}" con nivel "${nivel || 'Sin nivel'}"`,
          detalles: { 
            concursoId, 
            nivel, 
            area, 
            codigoProyecto,
            totalParticipantes: participantes.length,
            totalTutores: tutoresValidos.length
          },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.status(201).json({ ok: true, mensaje: 'Proyecto creado correctamente', data: proyecto });

    } catch (error) {
      console.error('ERROR CREATE PROYECTO:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al crear proyecto: ' + error.message });
    }
  },

  // ✅ ACTUALIZADO
  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { 
        nombre, 
        descripcion, 
        concursoId, 
        nivel, 
        area, 
        activo, 
        codigoProyecto,
        participantes, 
        tutores 
      } = req.body;

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
        codigo_proyecto: codigoProyecto || existente.codigo_proyecto,
        participantes: participantes !== undefined ? participantes : existente.participantes?.map(p => p.nombre) || [],
        tutores: tutores !== undefined ? tutores : existente.tutores?.map(t => t.nombre) || []
      });

      const proyectoActualizado = await ProyectoService.getById(id);

      // ✅ LOG: Proyecto actualizado
      try {
        let cambios = [];
        if (nombre !== existente.nombre) cambios.push(`nombre: "${existente.nombre}" → "${nombre.trim()}"`);
        if (area !== existente.area) cambios.push(`área: "${existente.area || 'Sin área'}" → "${area || 'Sin área'}"`);
        if (nivel !== existente.nivel) cambios.push(`nivel: "${existente.nivel || 'Sin nivel'}" → "${nivel || 'Sin nivel'}"`);
        if (activo !== existente.activo) cambios.push(`estado: ${existente.activo ? 'Activo' : 'Inactivo'} → ${activo ? 'Activo' : 'Inactivo'}`);

        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'proyecto',
          accion: 'editar',
          entidad_id: id,
          entidad_nombre: nombre.trim(),
          descripcion: `Se actualizó el proyecto "${nombre.trim()}"${cambios.length > 0 ? ': ' + cambios.join(', ') : ''}`,
          detalles: { 
            cambios: { 
              antes: { 
                nombre: existente.nombre, 
                area: existente.area, 
                nivel: existente.nivel,
                activo: existente.activo 
              }, 
              despues: { 
                nombre: nombre.trim(), 
                area: area || null, 
                nivel: nivel || null,
                activo: activo !== undefined ? activo : true
              } 
            } 
          },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json({ ok: true, mensaje: 'Proyecto actualizado correctamente', data: proyectoActualizado });

    } catch (error) {
      console.error('ERROR UPDATE PROYECTO:', error);
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

      // Guardar nombre para el log
      const nombreProyecto = existente.nombre;

      await ProyectoService.delete(id);

      // ✅ LOG: Proyecto eliminado
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'proyecto',
          accion: 'eliminar',
          entidad_id: id,
          entidad_nombre: nombreProyecto,
          descripcion: `Se eliminó el proyecto "${nombreProyecto}"`,
          detalles: { id, area: existente.area, nivel: existente.nivel },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json({ ok: true, mensaje: 'Proyecto eliminado correctamente' });

    } catch (error) {
      console.error('ERROR DELETE PROYECTO:', error);

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