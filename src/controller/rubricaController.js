const RubricaService = require('../services/rubricaService');
const LogsService = require('../services/logsService');
const db = require('../config/db');

const rubricaController = {

  async listar(req, res) {
    try {
      console.log('GET /api/rubricas');
      const rubricas = await RubricaService.listar();

      return res.json({
        ok: true,
        data: rubricas || []
      });

    } catch (error) {
      console.error('ERROR listar rubricas:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al listar rúbricas: ' + error.message
      });
    }
  },

  async obtener(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('GET /api/rubricas/' + id);

      const rubrica = await RubricaService.obtener(id);

      if (!rubrica) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Rúbrica no encontrada para este concurso'
        });
      }

      return res.json({
        ok: true,
        data: rubrica
      });

    } catch (error) {
      console.error('ERROR obtener rubrica:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener rúbrica: ' + error.message
      });
    }
  },

  async crear(req, res) {
    try {
      console.log('POST /api/rubricas');
      console.log('BODY RECIBIDO:', JSON.stringify(req.body, null, 2));

      if (!req.body.concurso_id) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El ID del concurso es obligatorio'
        });
      }

      if (!req.body.nombre || req.body.nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre de la rúbrica es obligatorio'
        });
      }

      // Obtener nombre del concurso para el log
      let nombreConcurso = 'Concurso';
      try {
        const [concurso] = await db.query(
          'SELECT nombre FROM concursos WHERE id = ?',
          [req.body.concurso_id]
        );
        if (concurso.length > 0) {
          nombreConcurso = concurso[0].nombre;
        }
      } catch (logError) {
        console.error("Error obteniendo nombre del concurso:", logError);
      }

      const rubrica = await RubricaService.crear({
        concurso_id: req.body.concurso_id,
        nombre: req.body.nombre.trim(),
        descripcion: req.body.descripcion || null,
        puntaje_maximo: req.body.puntaje_maximo || 100,
        secciones: req.body.secciones || [],
        niveles: req.body.niveles || []
      });

      // ✅ LOG: Rúbrica creada
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'rubrica',
          accion: 'crear',
          entidad_id: rubrica?.id || null,
          entidad_nombre: req.body.nombre.trim(),
          descripcion: `Se creó la rúbrica "${req.body.nombre.trim()}" para el concurso "${nombreConcurso}"`,
          detalles: { 
            concurso_id: req.body.concurso_id, 
            puntaje_maximo: req.body.puntaje_maximo || 100,
            totalSecciones: req.body.secciones?.length || 0,
            totalNiveles: req.body.niveles?.length || 0
          },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.status(201).json({
        ok: true,
        mensaje: 'Rúbrica creada correctamente',
        data: rubrica
      });

    } catch (error) {
      console.error('ERROR crear rubrica:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear rúbrica: ' + error.message
      });
    }
  },

  async actualizar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('PUT /api/rubricas/' + id);
      console.log('BODY RECIBIDO:', JSON.stringify(req.body, null, 2));

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El cuerpo de la solicitud está vacío'
        });
      }

      if (!req.body.nombre || req.body.nombre.trim() === '') {
        return res.status(400).json({
          ok: false,
          mensaje: 'El nombre de la rúbrica es obligatorio'
        });
      }

      // Obtener datos de la rúbrica antes de actualizar (para el log)
      let rubricaAntes = null;
      try {
        const [rubrica] = await db.query(
          `SELECT r.*, c.nombre as concurso_nombre 
           FROM rubricas r
           JOIN concursos c ON c.id = r.concurso_id
           WHERE r.id = ?`,
          [id]
        );
        if (rubrica.length > 0) {
          rubricaAntes = rubrica[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos de la rúbrica:", logError);
      }

      const rubrica = await RubricaService.actualizar(id, {
        nombre: req.body.nombre.trim(),
        descripcion: req.body.descripcion || null,
        puntaje_maximo: req.body.puntaje_maximo || 100
      });

      // ✅ LOG: Rúbrica actualizada
      try {
        if (rubricaAntes) {
          let cambios = [];
          if (req.body.nombre.trim() !== rubricaAntes.nombre) cambios.push(`nombre: "${rubricaAntes.nombre}" → "${req.body.nombre.trim()}"`);
          if (req.body.descripcion !== rubricaAntes.descripcion) cambios.push('descripción actualizada');
          if ((req.body.puntaje_maximo || 100) !== rubricaAntes.puntaje_maximo) cambios.push(`puntaje máximo: ${rubricaAntes.puntaje_maximo} → ${req.body.puntaje_maximo || 100}`);

          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'rubrica',
            accion: 'editar',
            entidad_id: id,
            entidad_nombre: req.body.nombre.trim(),
            descripcion: `Se actualizó la rúbrica "${req.body.nombre.trim()}"${cambios.length > 0 ? ': ' + cambios.join(', ') : ''}`,
            detalles: { 
              cambios: { 
                antes: { nombre: rubricaAntes.nombre, descripcion: rubricaAntes.descripcion, puntaje_maximo: rubricaAntes.puntaje_maximo }, 
                despues: { nombre: req.body.nombre.trim(), descripcion: req.body.descripcion || null, puntaje_maximo: req.body.puntaje_maximo || 100 } 
              } 
            },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json({
        ok: true,
        mensaje: 'Rúbrica actualizada correctamente',
        data: rubrica
      });

    } catch (error) {
      console.error('ERROR actualizar rubrica:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar rúbrica: ' + error.message
      });
    }
  },

  async eliminar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('DELETE /api/rubricas/' + id);

      // Obtener datos de la rúbrica antes de eliminar (para el log)
      let rubricaInfo = null;
      try {
        const [rubrica] = await db.query(
          `SELECT r.*, c.nombre as concurso_nombre 
           FROM rubricas r
           JOIN concursos c ON c.id = r.concurso_id
           WHERE r.id = ?`,
          [id]
        );
        if (rubrica.length > 0) {
          rubricaInfo = rubrica[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos de la rúbrica:", logError);
      }

      const eliminado = await RubricaService.eliminar(id);

      if (!eliminado) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Rúbrica no encontrada'
        });
      }

      // ✅ LOG: Rúbrica eliminada
      try {
        if (rubricaInfo) {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'rubrica',
            accion: 'eliminar',
            entidad_id: id,
            entidad_nombre: rubricaInfo.nombre,
            descripcion: `Se eliminó la rúbrica "${rubricaInfo.nombre}" del concurso "${rubricaInfo.concurso_nombre}"`,
            detalles: { id, concurso_id: rubricaInfo.concurso_id },
            req
          });
        } else {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'rubrica',
            accion: 'eliminar',
            entidad_id: id,
            entidad_nombre: `Rúbrica ID: ${id}`,
            descripcion: `Se eliminó la rúbrica ID ${id}`,
            detalles: { id },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json({
        ok: true,
        mensaje: 'Rúbrica eliminada correctamente'
      });

    } catch (error) {
      console.error('ERROR eliminar rubrica:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar rúbrica: ' + error.message
      });
    }
  },

  async exportar(req, res) {
    try {
      const id = parseInt(req.params.id);
      console.log('GET /api/rubricas/' + id + '/exportar');

      // Obtener información de la rúbrica para el log
      let rubricaInfo = null;
      try {
        const [rubrica] = await db.query(
          `SELECT r.*, c.nombre as concurso_nombre 
           FROM rubricas r
           JOIN concursos c ON c.id = r.concurso_id
           WHERE r.id = ?`,
          [id]
        );
        if (rubrica.length > 0) {
          rubricaInfo = rubrica[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos de la rúbrica:", logError);
      }

      const excelBuffer = await RubricaService.exportar(id);

      if (!excelBuffer) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Rúbrica no encontrada'
        });
      }

      // ✅ LOG: Rúbrica exportada
      try {
        if (rubricaInfo) {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'rubrica',
            accion: 'exportar',
            entidad_id: id,
            entidad_nombre: rubricaInfo.nombre,
            descripcion: `Exportó la rúbrica "${rubricaInfo.nombre}" del concurso "${rubricaInfo.concurso_nombre}"`,
            detalles: { id, concurso_id: rubricaInfo.concurso_id, formato: 'excel' },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=rubrica-concurso-' + id + '.xlsx');
      res.send(excelBuffer);

    } catch (error) {
      console.error('ERROR exportar rubrica:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al exportar rúbrica: ' + error.message
      });
    }
  }
};

module.exports = rubricaController;