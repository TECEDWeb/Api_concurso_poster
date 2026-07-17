const AsignacionService = require('../services/asignacionService');
const db = require('../config/db');

const controller = {

  // ============================================
  // 🔬 RUTA DE DIAGNÓSTICO - PARA DEBUG
  // ============================================
  async diagnosticar(req, res) {
    try {
      console.log("========================================");
      console.log("🔬 DIAGNÓSTICO DE ASIGNACIÓN");
      console.log("========================================");
      
      const { proyectoId } = req.query;
      
      if (!proyectoId) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Falta proyectoId'
        });
      }

      console.log("📌 Proyecto ID a diagnosticar:", proyectoId);

      // 1. Verificar proyecto
      const [proyectos] = await db.query(
        `SELECT id, nombre, concurso_id FROM proyectos WHERE id = ?`,
        [proyectoId]
      );

      if (proyectos.length === 0) {
        return res.json({
          ok: false,
          mensaje: 'Proyecto no encontrado',
          paso: 1
        });
      }

      const proyecto = proyectos[0];
      console.log("✅ Proyecto encontrado:", proyecto);

      // 2. Verificar rúbrica
      const [rubricas] = await db.query(
        `SELECT id, nombre, concurso_id FROM rubricas WHERE concurso_id = ?`,
        [proyecto.concurso_id]
      );

      console.log("📊 Rúbricas encontradas:", rubricas.length);
      
      let rubricaInfo = null;
      let tieneSecciones = false;
      
      if (rubricas.length > 0) {
        rubricaInfo = rubricas[0];
        console.log("✅ Rúbrica encontrada:", rubricaInfo);
        
        // 3. Verificar secciones
        const [secciones] = await db.query(
          `SELECT id, nombre FROM secciones WHERE rubrica_id = ?`,
          [rubricaInfo.id]
        );
        console.log("📊 Secciones encontradas:", secciones.length);
        tieneSecciones = secciones.length > 0;
        rubricaInfo.secciones = secciones.length;
      } else {
        console.log("❌ NO hay rúbrica para el concurso ID:", proyecto.concurso_id);
      }

      // 4. Verificar evaluadores
      const [evaluadores] = await db.query(
        `SELECT id, nombre, rol FROM usuarios WHERE rol = 'evaluador' AND activo = 1`
      );
      console.log("📊 Evaluadores disponibles:", evaluadores.length);

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
      console.error("❌ Error en diagnóstico:", error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error en diagnóstico: ' + error.message
      });
    }
  },

  // ============================================
  // LISTAR ASIGNACIONES
  // ============================================
  async listar(req, res) {
    try {
      const data = await AsignacionService.getAsignaciones();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al listar asignaciones'
      });
    }
  },

  // ============================================
  // LISTAR PROYECTOS
  // ============================================
  async proyectos(req, res) {
    try {
      const data = await AsignacionService.getProyectos();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener proyectos'
      });
    }
  },

  // ============================================
  // LISTAR EVALUADORES
  // ============================================
  async evaluadores(req, res) {
    try {
      const data = await AsignacionService.getEvaluadores();

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener evaluadores'
      });
    }
  },

  // ============================================
  // CREAR ASIGNACIÓN - CON LOGS DETALLADOS
  // ============================================
  async crear(req, res) {
    try {
      console.log("========================================");
      console.log("📥 CONTROLLER: CREAR ASIGNACION");
      console.log("========================================");
      console.log("📦 BODY RECIBIDO:", JSON.stringify(req.body, null, 2));
      console.log("👤 Usuario autenticado:", req.usuario);
      console.log("========================================");

      const { proyectoId, evaluadorId, proyecto_id, evaluador_id } = req.body;
      
      // soportar ambos formatos
      const proyecto = proyectoId || proyecto_id;
      const evaluador = evaluadorId || evaluador_id;

      console.log("📌 Proyecto ID (normalizado):", proyecto);
      console.log("📌 Evaluador ID (normalizado):", evaluador);

      if (!proyecto || !evaluador) {
        console.log("❌ Faltan datos: proyecto o evaluador");
        return res.status(400).json({
          ok: false,
          mensaje: 'Datos incompletos: proyecto y evaluador son obligatorios'
        });
      }

      console.log("🔵 Llamando a AsignacionService.crear()...");
      const data = await AsignacionService.crear(proyecto, evaluador);

      console.log("✅ ASIGNACION CREADA EXITOSAMENTE:", data);

      return res.status(201).json({
        ok: true,
        mensaje: 'Asignación creada correctamente',
        data
      });

    } catch (err) {
      console.error("========================================");
      console.error("❌ ERROR EN CONTROLLER.crear");
      console.error("========================================");
      console.error("📌 Mensaje de error:", err.message);
      console.error("📌 Stack trace:", err.stack);
      console.error("========================================");
      
      // ✅ MENSAJES AMIGABLES PARA EL USUARIO
      let mensaje = err.message;
      let statusCode = 400;

      // Detectar errores específicos
      if (mensaje === 'El proyecto no tiene rúbrica') {
        console.log("⚠️  CASO DETECTADO: Proyecto sin rúbrica");
        mensaje = '❌ El proyecto no tiene una rúbrica asociada. Por favor, crea una rúbrica primero.';
      } else if (mensaje === 'La rúbrica no tiene secciones configuradas. Ve a Rúbricas → Configurar contenido primero.') {
        console.log("⚠️  CASO DETECTADO: Rúbrica vacía (sin secciones)");
        mensaje = '⚠️ La rúbrica existe pero está vacía. Ve a la sección Rúbricas y configura el contenido (secciones y criterios).';
      } else if (mensaje === 'Ya existe una evaluación para este proyecto y evaluador') {
        console.log("⚠️  CASO DETECTADO: Asignación duplicada");
        mensaje = '⚠️ Ya existe una asignación para este proyecto y evaluador.';
      } else if (mensaje === 'Proyecto no encontrado') {
        console.log("⚠️  CASO DETECTADO: Proyecto inexistente");
        mensaje = '❌ Proyecto no encontrado. Verifica que exista.';
        statusCode = 404;
      } else if (mensaje === 'Evaluador no encontrado') {
        console.log("⚠️  CASO DETECTADO: Evaluador inexistente");
        mensaje = '❌ Evaluador no encontrado. Verifica que exista y tenga rol de evaluador.';
        statusCode = 404;
      } else {
        console.log("⚠️  CASO NO DETECTADO: Error genérico");
        // Mantener el mensaje original
      }

      console.log("📤 Respondiendo con:", { ok: false, mensaje });
      console.log("========================================");

      return res.status(statusCode).json({
        ok: false,
        mensaje: mensaje
      });
    }
  },

  // ============================================
  // ELIMINAR ASIGNACIÓN
  // ============================================
  async eliminar(req, res) {
    try {
      await AsignacionService.eliminar(req.params.id);

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