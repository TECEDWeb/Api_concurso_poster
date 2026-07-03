const db = require('../config/db');

const EvaluacionService = {

  /**
   * OBTENER RÚBRICA COMPLETA (FORMULARIO)
   */
  async getFormularioByConcurso(concursoId) {
    const [rubricaRows] = await db.query(
      `SELECT * FROM rubricas WHERE concurso_id = ? LIMIT 1`,
      [concursoId]
    );

    if (!rubricaRows.length) return null;

    const rubrica = rubricaRows[0];

    const [secciones] = await db.query(
      `SELECT * FROM secciones WHERE rubrica_id = ? ORDER BY orden`,
      [rubrica.id]
    );

    for (let sec of secciones) {
      const [criterios] = await db.query(
        `SELECT * FROM criterios WHERE seccion_id = ? ORDER BY orden`,
        [sec.id]
      );

      for (let c of criterios) {
        const [niveles] = await db.query(
          `SELECT * FROM niveles WHERE criterio_id = ?`,
          [c.id]
        );
        c.niveles = niveles;
      }

      sec.criterios = criterios;
    }

    return {
      rubrica,
      secciones
    };
  },

  /**
   * ASIGNAR PROYECTO A EVALUADOR
   */
  async asignarProyecto(evaluadorId, proyectoId) {
    const [result] = await db.query(
      `INSERT INTO evaluaciones (evaluador_id, proyecto_id, estado)
       VALUES (?, ?, 'asignado')`,
      [evaluadorId, proyectoId]
    );

    return { id: result.insertId };
  },

  /**
   * OBTENER PROYECTOS ASIGNADOS
   */
  async getAsignados(evaluadorId) {
    const [rows] = await db.query(
      `SELECT
          e.id AS evaluacionId,
          e.estado,
          p.id AS proyectoId,
          p.nombre AS proyectoNombre,
          p.descripcion AS proyectoDescripcion,
          c.tipo,
          c.fecha_inicio,
          c.fecha_fin,
          c.puntaje_maximo
       FROM evaluaciones e
       JOIN proyectos p ON e.proyecto_id = p.id
       LEFT JOIN concursos c ON p.concurso_id = c.id
       WHERE e.evaluador_id = ?`,
      [evaluadorId]
    );

    return rows.map(r => ({
      evaluacionId: r.evaluacionId,
      yaEvaluado: r.estado === 'evaluado',
      puedeEditar: r.fecha_fin
        ? new Date(r.fecha_fin) > new Date()
        : true,
      proyecto: {
        id: r.proyectoId,
        nombre: r.proyectoNombre,
        descripcion: r.proyectoDescripcion,
        tipo: r.tipo ?? null,
        puntajeMaximo: r.puntaje_maximo ?? null,
        participantes: []
      }
    }));
  },

  /**
   * GUARDAR EVALUACIÓN COMPLETA
   * (cabecera + detalle por criterios)
   */
  async guardarEvaluacion({ evaluacionId, observacion, detalles }) {
    // 1. actualizar estado
    await db.query(
      `UPDATE evaluaciones
       SET observaciones = ?, estado = 'evaluado', fecha_evaluacion = NOW()
       WHERE id = ?`,
      [observacion, evaluacionId]
    );

    // 2. eliminar anteriores (por seguridad)
    await db.query(
      `DELETE FROM detalles_evaluacion WHERE evaluacion_id = ?`,
      [evaluacionId]
    );

    // 3. insertar nuevos detalles
    for (const d of detalles) {
      await db.query(
        `INSERT INTO detalles_evaluacion (evaluacion_id, criterio_id, nivel_id)
         VALUES (?, ?, ?)`,
        [evaluacionId, d.criterio_id, d.nivel_id]
      );
    }

    return true;
  },

  /**
   * RESULTADOS DEL EVALUADOR
   */
  async getMisResultados(evaluadorId) {
    const [rows] = await db.query(
      `SELECT p.nombre, e.observaciones, e.estado
       FROM evaluaciones e
       JOIN proyectos p ON e.proyecto_id = p.id
       WHERE e.evaluador_id = ? AND e.estado = 'evaluado'`,
      [evaluadorId]
    );

    return rows;
  },

  /**
   * TODOS LOS RESULTADOS (ADMIN)
   */
  async getTodosResultados() {
    const [rows] = await db.query(
      `SELECT e.id, p.nombre AS proyecto, u.nombre AS evaluador, e.estado
       FROM evaluaciones e
       JOIN proyectos p ON e.proyecto_id = p.id
       JOIN usuarios u ON e.evaluador_id = u.id`
    );

    return rows;
  },

  /**
   * RESUMEN GENERAL
   */
  async getResumenEvaluador() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'evaluado' THEN 1 ELSE 0 END) AS completados,
        SUM(CASE WHEN estado = 'asignado' THEN 1 ELSE 0 END) AS pendientes
      FROM evaluaciones
    `);

    return rows; // 👈 NO rows[0]
  }
};

module.exports = EvaluacionService;