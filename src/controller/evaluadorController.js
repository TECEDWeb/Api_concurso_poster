const db = require('../config/db');

const evaluadorController = {

  /**
   * GET /api/evaluador/dashboard-stats
   */
  async getDashboardStats(req, res) {
    try {
      const evaluadorId = req.usuario.id;
      console.log('📊 Dashboard stats para evaluador:', evaluadorId);

      // Obtener proyectos asignados al evaluador
      const [asignaciones] = await db.query(`
        SELECT 
          e.id,
          e.estado,
          e.fecha_asignacion,
          e.fecha_evaluacion,
          p.id AS proyecto_id,
          p.nombre AS proyecto_nombre
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        WHERE e.evaluador_id = ?
      `, [evaluadorId]);

      const totalAsignados = asignaciones.length;
      const completados = asignaciones.filter(a => a.estado === 'evaluado').length;
      const pendientes = asignaciones.filter(a => a.estado === 'asignado').length;

      return res.json({
        ok: true,
        data: {
          asignados: totalAsignados,
          pendientes: pendientes,
          completados: completados
        }
      });

    } catch (error) {
      console.error('❌ ERROR getDashboardStats:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener estadísticas del dashboard'
      });
    }
  },

  /**
   * GET /api/evaluador/actividades-recientes
   */
  async getActividadesRecientes(req, res) {
    try {
      const evaluadorId = req.usuario.id;
      console.log('📋 Actividades recientes para evaluador:', evaluadorId);

      // Obtener evaluaciones recientes
      const [evaluaciones] = await db.query(`
        SELECT 
          e.id,
          'evaluacion' AS tipo,
          p.nombre AS proyecto_nombre,
          e.fecha_evaluacion AS fecha,
          e.estado
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        WHERE e.evaluador_id = ? AND e.fecha_evaluacion IS NOT NULL
        ORDER BY e.fecha_evaluacion DESC
        LIMIT 5
      `, [evaluadorId]);

      // Obtener asignaciones recientes
      const [asignaciones] = await db.query(`
        SELECT 
          e.id,
          'asignacion' AS tipo,
          p.nombre AS proyecto_nombre,
          e.fecha_asignacion AS fecha,
          e.estado
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        WHERE e.evaluador_id = ? 
        ORDER BY e.fecha_asignacion DESC
        LIMIT 5
      `, [evaluadorId]);

      // Combinar y ordenar
      const actividades = [...evaluaciones, ...asignaciones];
      actividades.sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
        const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
        return fechaB - fechaA;
      });

      // Formatear para el frontend
      const resultado = actividades.slice(0, 5).map(act => {
        let texto = '';
        let icon = '';
        let color = '';

        if (act.tipo === 'evaluacion') {
          texto = `Evaluaste el proyecto "${act.proyecto_nombre}"`;
          icon = 'checkmark-circle-outline';
          color = 'emerald';
        } else {
          texto = `Te asignaron el proyecto "${act.proyecto_nombre}"`;
          icon = 'folder-outline';
          color = 'indigo';
        }

        return {
          icon: icon,
          color: color,
          texto: texto,
          tiempo: formatTimeAgo(act.fecha)
        };
      });

      return res.json({
        ok: true,
        data: resultado
      });

    } catch (error) {
      console.error('❌ ERROR getActividadesRecientes:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener actividades recientes'
      });
    }
  },

  /**
   * GET /api/evaluador/proyectos-asignados
   */
  async getProyectosAsignados(req, res) {
    try {
      const evaluadorId = req.usuario.id;
      console.log('📋 Proyectos asignados para evaluador:', evaluadorId);

      const [proyectos] = await db.query(`
        SELECT 
          e.id AS evaluacionId,
          e.estado AS yaEvaluado,
          e.fecha_asignacion,
          e.fecha_evaluacion,
          p.id AS proyecto_id,
          p.nombre AS nombre,
          p.descripcion,
          c.nombre AS concursoNombre,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', u.id,
              'nombre', u.nombre,
              'cedula', u.cedula,
              'email', u.email
            )
          ) AS participantes
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        LEFT JOIN concursos c ON c.id = p.concurso_id
        LEFT JOIN usuarios u ON u.id = e.evaluador_id
        WHERE e.evaluador_id = ?
        GROUP BY e.id
        ORDER BY e.fecha_asignacion DESC
      `, [evaluadorId]);

      // Procesar participantes
      const proyectosFormateados = proyectos.map(p => ({
        evaluacionId: p.evaluacionId,
        yaEvaluado: p.yaEvaluado === 'evaluado',
        fechaAsignacion: p.fecha_asignacion,
        proyecto: {
          id: p.proyecto_id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          tipo: 'Proyecto',
          concursoNombre: p.concursoNombre,
          participantes: p.participantes || []
        }
      }));

      return res.json({
        ok: true,
        data: proyectosFormateados
      });

    } catch (error) {
      console.error('❌ ERROR getProyectosAsignados:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener proyectos asignados'
      });
    }
  },

  /**
   * GET /api/evaluador/proyecto/:id
   */
  async getProyectoAsignado(req, res) {
    try {
      const evaluadorId = req.usuario.id;
      const proyectoId = req.params.id;

      const [proyectos] = await db.query(`
        SELECT 
          e.id AS evaluacionId,
          e.estado AS yaEvaluado,
          p.id AS proyecto_id,
          p.nombre,
          p.descripcion,
          c.nombre AS concursoNombre
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        LEFT JOIN concursos c ON c.id = p.concurso_id
        WHERE e.evaluador_id = ? AND p.id = ?
      `, [evaluadorId, proyectoId]);

      if (proyectos.length === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Proyecto no encontrado o no asignado'
        });
      }

      return res.json({
        ok: true,
        data: proyectos[0]
      });

    } catch (error) {
      console.error('❌ ERROR getProyectoAsignado:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener proyecto'
      });
    }
  },

  /**
   * POST /api/evaluador/evaluacion
   */
  async guardarEvaluacion(req, res) {
    try {
      const evaluadorId = req.usuario.id;
      const { evaluacionId, detalles, observacion } = req.body;

      console.log('📝 Guardando evaluación:', { evaluacionId, detalles, observacion });

      // Actualizar evaluación
      await db.query(`
        UPDATE evaluaciones 
        SET estado = 'evaluado', 
            fecha_evaluacion = NOW(),
            observaciones = ?
        WHERE id = ? AND evaluador_id = ?
      `, [observacion || null, evaluacionId, evaluadorId]);

      // Guardar detalles de evaluación
      for (const detalle of detalles) {
        await db.query(`
          INSERT INTO detalles_evaluacion (evaluacion_id, criterio_id, nivel_id)
          VALUES (?, ?, ?)
        `, [evaluacionId, detalle.criterio_id, detalle.nivel_id]);
      }

      return res.json({
        ok: true,
        mensaje: 'Evaluación guardada correctamente'
      });

    } catch (error) {
      console.error('❌ ERROR guardarEvaluacion:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al guardar la evaluación'
      });
    }
  },

  /**
   * GET /api/evaluador/mis-resultados
   */
  async getMisResultados(req, res) {
    try {
      const evaluadorId = req.usuario.id;

      const [resultados] = await db.query(`
        SELECT 
          e.id,
          p.nombre AS proyectoNombre,
          c.nombre AS concursoNombre,
          u.nombre AS evaluadorNombre,
          e.fecha_evaluacion AS fecha,
          COALESCE((
            SELECT SUM(n.puntaje) 
            FROM detalles_evaluacion d
            JOIN niveles n ON n.id = d.nivel_id
            WHERE d.evaluacion_id = e.id
          ), 0) AS puntajeTotal,
          r.puntaje_maximo AS puntajeMaximo,
          ROUND(
            COALESCE((
              SELECT SUM(n.puntaje) 
              FROM detalles_evaluacion d
              JOIN niveles n ON n.id = d.nivel_id
              WHERE d.evaluacion_id = e.id
            ), 0) / r.puntaje_maximo * 100, 1
          ) AS porcentaje
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        LEFT JOIN concursos c ON c.id = p.concurso_id
        JOIN usuarios u ON u.id = e.evaluador_id
        JOIN rubricas r ON r.concurso_id = p.concurso_id
        WHERE e.evaluador_id = ? AND e.estado = 'evaluado'
        ORDER BY e.fecha_evaluacion DESC
      `, [evaluadorId]);

      return res.json({
        ok: true,
        data: resultados
      });

    } catch (error) {
      console.error('❌ ERROR getMisResultados:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener resultados'
      });
    }
  },

  /**
   * GET /api/evaluador/resultado/:id
   */
  async getResultadoDetalle(req, res) {
    try {
      const evaluadorId = req.usuario.id;
      const resultadoId = req.params.id;

      const [resultados] = await db.query(`
        SELECT 
          e.id,
          p.nombre AS proyectoNombre,
          c.nombre AS concursoNombre,
          e.fecha_evaluacion AS fecha,
          e.observaciones,
          r.nombre AS rubricaNombre,
          r.puntaje_maximo AS puntajeMaximo,
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'seccion', s.nombre,
                'criterio', cr.texto,
                'nivel', n.nombre,
                'puntaje', n.puntaje
              )
            )
            FROM detalles_evaluacion d
            JOIN criterios cr ON cr.id = d.criterio_id
            JOIN secciones s ON s.id = cr.seccion_id
            JOIN niveles n ON n.id = d.nivel_id
            WHERE d.evaluacion_id = e.id
            ORDER BY s.orden, cr.orden
          ) AS detalles
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        LEFT JOIN concursos c ON c.id = p.concurso_id
        JOIN rubricas r ON r.concurso_id = p.concurso_id
        WHERE e.id = ? AND e.evaluador_id = ? AND e.estado = 'evaluado'
      `, [resultadoId, evaluadorId]);

      if (resultados.length === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Resultado no encontrado'
        });
      }

      return res.json({
        ok: true,
        data: resultados[0]
      });

    } catch (error) {
      console.error('❌ ERROR getResultadoDetalle:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener detalle del resultado'
      });
    }
  }
};

// Función auxiliar para formatear tiempo
function formatTimeAgo(fecha) {
  if (!fecha) return 'Recientemente';
  
  try {
    const now = new Date();
    const date = new Date(fecha);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES');
  } catch {
    return 'Recientemente';
  }
}

module.exports = evaluadorController;