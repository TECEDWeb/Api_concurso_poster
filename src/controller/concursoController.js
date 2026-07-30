const concursoService = require('../services/concursoService');
const LogsService = require('../services/logsService');

const concursoController = {

  async listar(req, res) {
    try {
      console.log('GET /concursos');
      const usuario = req.usuario; // Obtenemos el usuario del token

      // Llamamos al servicio pasándole el usuario para que filtre
      const concursos = await concursoService.listar(usuario);
      
      return res.json({
        ok: true,
        data: concursos
      });
    } catch (error) {
      console.error('ERROR listar concursos:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al listar concursos'
      });
    }
  },

  async obtenerPorId(req, res) {
    try {
      const id = parseInt(req.params.id);
      const usuario = req.usuario;
      console.log('GET /concursos/' + id);

      // Llamamos al servicio pasándole el usuario para validar permisos
      const concurso = await concursoService.obtenerPorId(id, usuario);

      if (!concurso) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Concurso no encontrado o no tienes permisos para verlo'
        });
      }

      return res.json({
        ok: true,
        data: concurso
      });
    } catch (error) {
      console.error('ERROR obtener concurso:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener concurso'
      });
    }
  },

  async generarReporte(req, res) {
    try {
      const id = parseInt(req.params.id);
      const usuario = req.usuario;
      console.log('GET /concursos/' + id + '/reporte');

      // Reutilizamos la misma lógica de seguridad de obtenerPorId
      const concurso = await concursoService.obtenerPorId(id, usuario);
      if (!concurso) {
        return res.status(404).json({ ok: false, mensaje: 'Concurso no encontrado o sin permisos' });
      }

      // --- AQUÍ EN EL FUTURO IRÍA LA GENERACIÓN DEL EXCEL/PDF ---
      // Por ahora devolvemos la estructura base
      
      return res.json({
        ok: true,
        mensaje: 'Reporte generado correctamente',
        data: {
          id: concurso.id,
          nombre: concurso.nombre,
          // Aquí iría la lista de proyectos y sus notas
          proyectos: [] 
        }
      });

    } catch (error) {
      console.error('ERROR generar reporte:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al generar el reporte'
      });
    }
  },

  async crear(req, res) {
    try {
      console.log('POST /concursos', req.body);

      const { nombre, descripcion, tipo, fecha_inicio, fecha_fin, puntaje_maximo, activo, coordinador_id } = req.body;

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre del concurso es obligatorio'
        });
      }

      const id = await concursoService.crear({
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        tipo: tipo || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        puntaje_maximo: puntaje_maximo || null,
        activo: activo !== undefined ? activo : true,
        coordinador_id: coordinador_id || null
      });

      const concursoCreado = await concursoService.obtenerPorId(id, req.usuario);

      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'concurso',
          accion: 'crear',
          entidad_id: id,
          entidad_nombre: nombre.trim(),
          descripcion: `Se creó el concurso "${nombre.trim()}"`,
          detalles: { 
            tipo: tipo || null, 
            fecha_inicio: fecha_inicio || null, 
            fecha_fin: fecha_fin || null,
            puntaje_maximo: puntaje_maximo || null,
            coordinador_id: coordinador_id || null
          },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
      }

      return res.status(201).json({
        ok: true,
        mensaje: 'Concurso creado correctamente',
        data: concursoCreado
      });
    } catch (error) {
      console.error('ERROR crear concurso:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear concurso'
      });
    }
  },

  async actualizar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('PUT /concursos/' + id, req.body);

      const { nombre, descripcion, tipo, fecha_inicio, fecha_fin, puntaje_maximo, activo, coordinador_id } = req.body;

      const existe = await concursoService.obtenerPorId(id, req.usuario);
      if (!existe) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Concurso no encontrado o sin permisos'
        });
      }

      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre del concurso es obligatorio'
        });
      }

      await concursoService.actualizar(id, {
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        tipo: tipo || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        puntaje_maximo: puntaje_maximo || null,
        activo: activo !== undefined ? activo : true,
        coordinador_id: coordinador_id || null
      });

      const concursoActualizado = await concursoService.obtenerPorId(id, req.usuario);

      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'concurso',
          accion: 'editar',
          entidad_id: id,
          entidad_nombre: nombre.trim(),
          descripcion: `Se actualizó el concurso "${nombre.trim()}"`,
          detalles: { 
            cambios: { 
              antes: { 
                nombre: existe.nombre, 
                tipo: existe.tipo, 
                activo: existe.activo 
              }, 
              despues: { 
                nombre: nombre.trim(), 
                tipo: tipo || null, 
                activo: activo !== undefined ? activo : true 
              } 
            } 
          },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
      }

      return res.json({
        ok: true,
        mensaje: 'Concurso actualizado correctamente',
        data: concursoActualizado
      });
    } catch (error) {
      console.error('ERROR actualizar concurso:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar concurso'
      });
    }
  },

  async eliminar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('DELETE /concursos/' + id);

      const existe = await concursoService.obtenerPorId(id, req.usuario);
      if (!existe) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Concurso no encontrado o sin permisos'
        });
      }

      const nombreConcurso = existe.nombre;
      await concursoService.eliminar(id);

      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'concurso',
          accion: 'eliminar',
          entidad_id: id,
          entidad_nombre: nombreConcurso,
          descripcion: `Se eliminó el concurso "${nombreConcurso}"`,
          detalles: { id },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
      }

      return res.json({
        ok: true,
        mensaje: 'Concurso eliminado correctamente'
      });
    } catch (error) {
      console.error('ERROR eliminar concurso:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar concurso'
      });
    }
  }
};

module.exports = concursoController;