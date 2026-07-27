const concursoModel = require('../model/concursoModel');
const LogsService = require('../services/logsService');

const concursoController = {

  async listar(req, res) {
    try {
      console.log('GET /concursos');
      const concursos = await concursoModel.listar();
      
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
      console.log('GET /concursos/' + id);

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
      console.error('ERROR obtener concurso:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener concurso'
      });
    }
  },

  async crear(req, res) {
    try {
      console.log('POST /concursos', req.body);

      const { nombre, descripcion, tipo, fecha_inicio, fecha_fin, puntaje_maximo, activo } = req.body;

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

      // ✅ LOG: Concurso creado
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
            puntaje_maximo: puntaje_maximo || null
          },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
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

      const { nombre, descripcion, tipo, fecha_inicio, fecha_fin, puntaje_maximo, activo } = req.body;

      const existe = await concursoModel.buscarPorId(id);
      if (!existe) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Concurso no encontrado'
        });
      }

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

      // ✅ LOG: Concurso actualizado
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
        // No interrumpimos el flujo si falla el log
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

      const existe = await concursoModel.buscarPorId(id);
      if (!existe) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Concurso no encontrado'
        });
      }

      // Guardar nombre antes de eliminar
      const nombreConcurso = existe.nombre;

      await concursoModel.eliminar(id);

      // ✅ LOG: Concurso eliminado
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
        // No interrumpimos el flujo si falla el log
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