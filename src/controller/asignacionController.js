const AsignacionService = require('../services/asignacionService');
const LogsService = require('../services/logsService');
const db = require('../config/db');

const controller = {

  async diagnosticar(req, res) {
    try {
      console.log("========================================");
      console.log("DIAGNÓSTICO DE ASIGNACIÓN");
      console.log("========================================");
      
      const { proyectoId } = req.query;
      
      if (!proyectoId) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Falta proyectoId'
        });
      }

      console.log("Proyecto ID a diagnosticar:", proyectoId);

      const [proyectos] = await db.query(
        `SELECT id, nombre, concurso_id FROM proyectos WHERE id = ?`,
        [proyectoId]
      );

      if (proyectos.length === 0) {
        return res.json({
          ok: false,
          mensaje: 'Proyecto no encontrado'
        });
      }

      const proyecto = proyectos[0];
      console.log("Proyecto encontrado:", proyecto);

      const [rubricas] = await db.query(
        `SELECT id, nombre, concurso_id FROM rubricas WHERE concurso_id = ?`,
        [proyecto.concurso_id]
      );

      console.log("Rúbricas encontradas:", rubricas.length);
      
      let rubricaInfo = null;
      let tieneSecciones = false;
      
      if (rubricas.length > 0) {
        rubricaInfo = rubricas[0];
        console.log("Rúbrica encontrada:", rubricaInfo);
        
        const [secciones] = await db.query(
          `SELECT id, nombre FROM secciones WHERE rubrica_id = ?`,
          [rubricaInfo.id]
        );
        console.log("Secciones encontradas:", secciones.length);
        tieneSecciones = secciones.length > 0;
        rubricaInfo.secciones = secciones.length;
      } else {
        console.log("NO hay rúbrica para el concurso ID:", proyecto.concurso_id);
      }

      const [evaluadores] = await db.query(
        `SELECT id, nombre, rol FROM usuarios WHERE rol = 'evaluador' AND activo = 1`
      );
      console.log("Evaluadores disponibles:", evaluadores.length);

      return res.json({
        ok: true,
        data: {
          proyecto: {
            id: proyecto.id,
            nombre: proyecto.nombre,
            concurso_id: proyecto.concurso_id
          },
          rubrica: rubricaInfo || null,
          tieneRubrica: rubricas.length > 0,
          tieneSecciones: tieneSecciones,
          evaluadores: evaluadores.map(e => ({
            id: e.id,
            nombre: e.nombre
          }))
        }
      });

    } catch (error) {
      console.error("Error en diagnóstico:", error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error en diagnóstico: ' + error.message
      });
    }
  },

  async listar(req, res) {
    try {
      const data = await AsignacionService.getAsignaciones();
      return res.json({ ok: true, data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al listar asignaciones'
      });
    }
  },

  async proyectos(req, res) {
    try {
      const data = await AsignacionService.getProyectos();
      return res.json({ ok: true, data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener proyectos'
      });
    }
  },

  async evaluadores(req, res) {
    try {
      const data = await AsignacionService.getEvaluadores();
      return res.json({ ok: true, data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener evaluadores'
      });
    }
  },

  async crear(req, res) {
    try {
      console.log("========================================");
      console.log("CONTROLLER: CREAR ASIGNACION");
      console.log("========================================");
      console.log("BODY RECIBIDO:", JSON.stringify(req.body, null, 2));
      console.log("Usuario autenticado:", req.usuario);
      console.log("========================================");

      const { proyectoId, evaluadorId, proyecto_id, evaluador_id } = req.body;
      
      const proyecto = proyectoId || proyecto_id;
      const evaluador = evaluadorId || evaluador_id;

      console.log("Proyecto ID (normalizado):", proyecto);
      console.log("Evaluador ID (normalizado):", evaluador);

      if (!proyecto || !evaluador) {
        console.log("Faltan datos: proyecto o evaluador");
        return res.status(400).json({
          ok: false,
          mensaje: 'Datos incompletos: proyecto y evaluador son obligatorios'
        });
      }

      console.log("Llamando a AsignacionService.crear()...");
      const data = await AsignacionService.crear(proyecto, evaluador);

      console.log("ASIGNACION CREADA EXITOSAMENTE:", data);

      // ✅ LOG: Asignación creada
      try {
        // Obtener nombres para el log
        const [proyectoInfo] = await db.query(
          `SELECT nombre FROM proyectos WHERE id = ?`,
          [proyecto]
        );
        const [evaluadorInfo] = await db.query(
          `SELECT nombre FROM usuarios WHERE id = ?`,
          [evaluador]
        );

        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'asignacion',
          accion: 'crear',
          entidad_id: data?.id || null,
          entidad_nombre: `Asignación: ${proyectoInfo[0]?.nombre || 'Proyecto'} → ${evaluadorInfo[0]?.nombre || 'Evaluador'}`,
          descripcion: `Se asignó el proyecto "${proyectoInfo[0]?.nombre || 'ID:'+proyecto}" al evaluador "${evaluadorInfo[0]?.nombre || 'ID:'+evaluador}"`,
          detalles: { proyectoId: proyecto, evaluadorId: evaluador },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.status(201).json({
        ok: true,
        mensaje: 'Asignación creada correctamente',
        data
      });

    } catch (err) {
      console.error("========================================");
      console.error("ERROR EN CONTROLLER.crear");
      console.error("========================================");
      console.error("Mensaje de error:", err.message);
      console.error("Stack trace:", err.stack);
      console.error("========================================");
      
      let mensaje = err.message;
      let statusCode = 400;

      if (mensaje === 'El proyecto no tiene rúbrica') {
        mensaje = 'El proyecto no tiene una rúbrica asociada. Por favor, crea una rúbrica primero.';
      } else if (mensaje === 'La rúbrica no tiene secciones configuradas. Ve a Rúbricas → Configurar contenido primero.') {
        mensaje = 'La rúbrica existe pero está vacía. Ve a la sección Rúbricas y configura el contenido.';
      } else if (mensaje === 'Ya existe una evaluación para este proyecto y evaluador') {
        mensaje = 'Ya existe una asignación para este proyecto y evaluador.';
      } else if (mensaje === 'Proyecto no encontrado') {
        mensaje = 'Proyecto no encontrado.';
        statusCode = 404;
      } else if (mensaje === 'Evaluador no encontrado') {
        mensaje = 'Evaluador no encontrado.';
        statusCode = 404;
      }

      return res.status(statusCode).json({
        ok: false,
        mensaje: mensaje
      });
    }
  },

  async eliminar(req, res) {
    try {
      const asignacionId = req.params.id;

      // ✅ Obtener datos de la asignación antes de eliminar (para el log)
      let proyectoNombre = 'Proyecto';
      let evaluadorNombre = 'Evaluador';
      let proyectoId = null;
      let evaluadorId = null;

      try {
        const [asignacionInfo] = await db.query(
          `SELECT a.*, p.nombre as proyecto_nombre, u.nombre as evaluador_nombre 
           FROM asignaciones a
           JOIN proyectos p ON p.id = a.proyecto_id
           JOIN usuarios u ON u.id = a.evaluador_id
           WHERE a.id = ?`,
          [asignacionId]
        );

        if (asignacionInfo.length > 0) {
          proyectoNombre = asignacionInfo[0].proyecto_nombre || 'Proyecto';
          evaluadorNombre = asignacionInfo[0].evaluador_nombre || 'Evaluador';
          proyectoId = asignacionInfo[0].proyecto_id;
          evaluadorId = asignacionInfo[0].evaluador_id;
        }
      } catch (logError) {
        console.error("Error obteniendo datos para log:", logError);
      }

      await AsignacionService.eliminar(asignacionId);

      // ✅ LOG: Asignación eliminada
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'asignacion',
          accion: 'eliminar',
          entidad_id: parseInt(asignacionId),
          entidad_nombre: `Asignación: ${proyectoNombre} → ${evaluadorNombre}`,
          descripcion: `Se eliminó la asignación del proyecto "${proyectoNombre}" al evaluador "${evaluadorNombre}"`,
          detalles: { proyectoId, evaluadorId },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json({
        ok: true,
        mensaje: 'Asignación eliminada correctamente'
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar asignación'
      });
    }
  }
};

module.exports = controller;