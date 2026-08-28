const db = require('../config/db');

const ReporteService = {

  // ============================================
  // DETALLE DE PROYECTO
  // ============================================
  async getDetalleProyecto(proyectoId) {
    try {
      // Obtener proyecto
      const [proyectos] = await db.query(
        `SELECT id, nombre, descripcion, area, nivel, concurso_id 
         FROM proyectos WHERE id = ?`,
        [proyectoId]
      );

      if (proyectos.length === 0) {
        return null;
      }

      const proyecto = proyectos[0];

      // Obtener evaluaciones
      const [evaluaciones] = await db.query(`
        SELECT 
          e.id,
          u.nombre AS evaluador,
          u.rol,
          e.estado,
          e.fecha_evaluacion,
          e.observaciones,
          ROUND(SUM(n.puntaje), 2) AS puntaje_total
        FROM evaluaciones e
        JOIN usuarios u ON u.id = e.evaluador_id
        LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
        LEFT JOIN niveles n ON n.id = d.nivel_id
        WHERE e.proyecto_id = ?
        GROUP BY e.id, u.nombre, u.rol, e.estado, e.fecha_evaluacion, e.observaciones
        ORDER BY e.fecha_evaluacion DESC
      `, [proyectoId]);

      // Obtener evaluadores
      const [evaluadores] = await db.query(`
        SELECT 
          u.id,
          u.nombre,
          u.rol,
          ROUND(SUM(n.puntaje), 2) AS puntaje,
          ROUND(AVG(n.puntaje), 2) AS promedio
        FROM evaluaciones e
        JOIN usuarios u ON u.id = e.evaluador_id
        LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
        LEFT JOIN niveles n ON n.id = d.nivel_id
        WHERE e.proyecto_id = ?
        GROUP BY u.id, u.nombre, u.rol
        ORDER BY puntaje DESC
      `, [proyectoId]);

      // Calcular promedio
      const [promedioResult] = await db.query(`
        SELECT ROUND(AVG(total_puntaje), 2) AS promedio FROM (
          SELECT SUM(n.puntaje) AS total_puntaje
          FROM evaluaciones e
          JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
          JOIN niveles n ON n.id = d.nivel_id
          WHERE e.proyecto_id = ?
          GROUP BY e.id
        ) AS puntajes
      `, [proyectoId]);

      // Obtener participantes y tutores
      const [participantes] = await db.query(
        `SELECT id, nombre, cedula, email FROM participantes WHERE proyecto_id = ?`,
        [proyectoId]
      );

      const [tutores] = await db.query(
        `SELECT id, nombre, encargado, cedula, email FROM tutores WHERE proyecto_id = ?`,
        [proyectoId]
      );

      return {
        id: proyecto.id,
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion || '',
        area: proyecto.area || null,
        nivel: proyecto.nivel || null,
        concursoId: proyecto.concurso_id || null,
        evaluaciones: evaluaciones.map(e => ({
          ...e,
          puntaje_total: Number(e.puntaje_total) || 0
        })),
        evaluadores: evaluadores.map(e => ({
          ...e,
          puntaje: Number(e.puntaje) || 0,
          promedio: Number(e.promedio) || 0
        })),
        participantes,
        tutores,
        promedio: Number(promedioResult[0]?.promedio) || 0,
        totalEvaluaciones: evaluaciones.length
      };

    } catch (error) {
      console.error('Error en getDetalleProyecto:', error);
      throw error;
    }
  },

  // ============================================
  // EXPORTAR PROYECTO
  // ============================================
  async exportarProyecto(proyectoId) {
    try {
      const [proyectos] = await db.query(
        `SELECT id, nombre, descripcion, area, nivel FROM proyectos WHERE id = ?`,
        [proyectoId]
      );

      if (proyectos.length === 0) {
        return null;
      }

      const proyecto = proyectos[0];

      const [rows] = await db.query(`
        SELECT
          u.nombre AS evaluador,
          u.rol,
          ROUND(SUM(n.puntaje), 2) AS puntaje,
          ROUND(AVG(n.puntaje), 2) AS promedio
        FROM evaluaciones e
        JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
        JOIN niveles n ON n.id = d.nivel_id
        JOIN usuarios u ON u.id = e.evaluador_id
        WHERE e.proyecto_id = ?
        GROUP BY u.id, u.nombre, u.rol
        ORDER BY puntaje DESC
      `, [proyectoId]);

      return {
        proyecto,
        evaluadores: rows.map(r => ({
          ...r,
          puntaje: Number(r.puntaje) || 0,
          promedio: Number(r.promedio) || 0
        }))
      };

    } catch (error) {
      console.error('Error en exportarProyecto:', error);
      throw error;
    }
  },

  // ============================================
  // OBTENER JURADO POR CONCURSO
  // ============================================
  async getJuradoByConcurso(concursoId) {
    try {
      const [juradoRows] = await db.query(`
        SELECT DISTINCT
          u.id,
          u.nombre,
          u.rol,
          u.email,
          u.departamento,
          u.cedula
        FROM usuarios u
        INNER JOIN asignaciones a ON a.evaluador_id = u.id
        INNER JOIN proyectos p ON p.id = a.proyecto_id
        WHERE p.concurso_id = ?
          AND u.rol = 'evaluador'
          AND u.activo = 1
        ORDER BY u.nombre ASC
      `, [concursoId]);

      if (juradoRows.length === 0) {
        return [];
      }

      return juradoRows.map(j => ({
        nombre: j.nombre,
        rol: j.rol,
        email: j.email,
        departamento: j.departamento,
        cedula: j.cedula
      }));

    } catch (error) {
      console.error('Error en getJuradoByConcurso:', error);
      return [];
    }
  },

  // ============================================
  // OBTENER JURADO CON DETALLES COMPLETOS
  // ============================================
  async getJuradoDetalleByConcurso(concursoId) {
    try {
      const [juradoRows] = await db.query(`
        SELECT DISTINCT
          u.id,
          u.nombre,
          u.rol,
          u.email,
          u.departamento,
          u.cedula,
          COUNT(a.id) AS proyectos_asignados,
          COUNT(DISTINCT CASE WHEN a.estado = 'evaluado' THEN a.proyecto_id END) AS proyectos_evaluados
        FROM usuarios u
        INNER JOIN asignaciones a ON a.evaluador_id = u.id
        INNER JOIN proyectos p ON p.id = a.proyecto_id
        WHERE p.concurso_id = ?
          AND u.rol = 'evaluador'
          AND u.activo = 1
        GROUP BY u.id, u.nombre, u.rol, u.email, u.departamento, u.cedula
        ORDER BY u.nombre ASC
      `, [concursoId]);

      return juradoRows;

    } catch (error) {
      console.error('Error en getJuradoDetalleByConcurso:', error);
      return [];
    }
  },

  // ============================================
  // OBTENER CONCURSO POR ID
  // ============================================
  async getConcursoById(concursoId) {
    try {
      const [rows] = await db.query(
        `SELECT id, nombre, descripcion, tipo, activo, fecha_inicio, fecha_fin 
         FROM concursos WHERE id = ?`,
        [concursoId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error en getConcursoById:', error);
      return null;
    }
  },

  // ============================================
  // OBTENER ESTADÍSTICAS DEL CONCURSO
  // ============================================
  async getStatsByConcurso(concursoId) {
    try {
      // Total proyectos
      const [[proyectos]] = await db.query(
        `SELECT COUNT(*) AS total FROM proyectos WHERE concurso_id = ?`,
        [concursoId]
      );

      // Total evaluaciones
      const [[evaluaciones]] = await db.query(`
        SELECT COUNT(*) AS total
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        WHERE p.concurso_id = ?
      `, [concursoId]);

      // Evaluaciones completadas
      const [[completadas]] = await db.query(`
        SELECT COUNT(*) AS total
        FROM evaluaciones e
        JOIN proyectos p ON p.id = e.proyecto_id
        WHERE p.concurso_id = ? AND e.estado = 'evaluado'
      `, [concursoId]);

      // Promedio general
      let promedio = 0;
      try {
        const [promedioResult] = await db.query(`
          SELECT ROUND(AVG(total_puntaje), 2) AS promedio FROM (
            SELECT SUM(n.puntaje) AS total_puntaje
            FROM evaluaciones e
            JOIN proyectos p ON p.id = e.proyecto_id
            JOIN detalles_evaluacion d ON e.id = d.evaluacion_id
            JOIN niveles n ON d.nivel_id = n.id
            WHERE p.concurso_id = ?
            GROUP BY e.id
          ) AS puntajes
        `, [concursoId]);
        promedio = Number(promedioResult[0]?.promedio) || 0;
      } catch (e) {
        promedio = 0;
      }

      return {
        proyectos: Number(proyectos.total) || 0,
        evaluaciones: Number(evaluaciones.total) || 0,
        completadas: Number(completadas.total) || 0,
        promedio: Math.round(promedio * 10) / 10
      };

    } catch (error) {
      console.error('Error en getStatsByConcurso:', error);
      return { proyectos: 0, evaluaciones: 0, completadas: 0, promedio: 0 };
    }
  }
};

module.exports = ReporteService;