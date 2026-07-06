const db = require('../config/db');

const EvaluacionService = {

  
  async getFormularioByConcurso(concursoId) {
    console.log("Buscando rúbrica para concurso:", concursoId);
    const [rubricaRows] = await db.query(
      `SELECT * FROM rubricas WHERE concurso_id = ? LIMIT 1`,
      [concursoId]
    );

    console.log("Rúbrica encontrada:", rubricaRows);
    if (!rubricaRows.length) return null;

    const rubrica = rubricaRows[0];

    const [secciones] = await db.query(
      `SELECT * FROM secciones WHERE rubrica_id = ? ORDER BY orden`,
      [rubrica.id]
    );

    console.log("Secciones encontradas:", secciones);
    for (let sec of secciones) {
      const [criterios] = await db.query(
        `SELECT * FROM criterios WHERE seccion_id = ? ORDER BY orden`,
        [sec.id]
      );

      console.log("Criterios encontrados:", criterios);
      for (let c of criterios) {
        const [niveles] = await db.query(
          `SELECT * FROM niveles WHERE criterio_id = ?`,
          [c.id]
        );
        console.log("Niveles encontrados:", niveles);
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

    try {

      console.log('🟡 Creando asignación');
      console.log('Evaluador:', evaluadorId);
      console.log('Proyecto:', proyectoId);


      // 1. Obtener la rúbrica del concurso del proyecto
      const [rubricas] = await db.query(
        `
        SELECT 
          r.id AS rubrica_id
        FROM rubricas r
        INNER JOIN proyectos p
          ON p.concurso_id = r.concurso_id
        WHERE p.id = ?
        LIMIT 1
        `,
        [proyectoId]
      );


      if (!rubricas.length) {

        throw new Error(
          'El proyecto no tiene una rúbrica configurada'
        );

      }


      const rubricaId = rubricas[0].rubrica_id;


      console.log('🟢 Rúbrica encontrada:', rubricaId);



      // 2. Crear la evaluación
      const [result] = await db.query(
        `
        INSERT INTO evaluaciones
        (
          proyecto_id,
          evaluador_id,
          rubrica_id,
          estado,
          fecha_asignacion
        )
        VALUES (?, ?, ?, 'asignado', NOW())
        `,
        [
          proyectoId,
          evaluadorId,
          rubricaId
        ]
      );


      console.log(
        '🟢 Evaluación creada ID:',
        result.insertId
      );


      return {
        id: result.insertId,
        proyecto_id: proyectoId,
        evaluador_id: evaluadorId,
        rubrica_id: rubricaId,
        estado: 'asignado'
      };


    } catch (error) {

      console.error(
        '🔴 Error asignando proyecto:',
        error
      );

      throw error;

    }

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
      FROM evaluaciones`);

    return rows; 
  },

  async getFormulario(evaluacionId) {
    try {

      const [rows] = await db.query(
        `SELECT 
            e.id,
            p.id AS proyecto_id,
            p.concurso_id
        FROM evaluaciones e
        JOIN proyectos p ON e.proyecto_id = p.id
        WHERE e.id = ?`,
        [evaluacionId]
      );

      console.log("Evaluación encontrada:", rows);

      // 🔴 SI NO EXISTE → RESPUESTA CONTROLADA
      if (!rows || rows.length === 0) {
        return {
          ok: false,
          mensaje: `No existe la evaluación ${evaluacionId}`,
          data: null
        };
      }

      const evaluacion = rows[0];

      // 🔴 VALIDACIÓN EXTRA SEGURA
      if (!evaluacion.concurso_id) {
        return {
          ok: false,
          mensaje: 'La evaluación no tiene concurso asociado',
          data: null
        };
      }
      if (evaluacion.estado === 'evaluado') {
        return {
          ok: false,
          mensaje: 'Esta evaluación ya fue completada'
        };
      }

      // 🔵 FLUJO NORMAL (NO CAMBIA NADA)
      const formulario = await this.getFormularioByConcurso(evaluacion.concurso_id);

      return {
        ok: true,
        data: {
          evaluacion_id: evaluacion.id,
          proyecto_id: evaluacion.proyecto_id,
          ...formulario
        }
      };

    } catch (error) {

      console.error('ERROR getFormulario:', error);

      return {
        ok: false,
        mensaje: 'Error interno al generar formulario',
        data: null
      };
    }
  },

  async asignarMasivo(proyectoId, evaluadores) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // buscar rúbrica del proyecto
    const [rubricas] = await connection.query(
      `
      SELECT r.id AS rubrica_id
      FROM proyectos p
      INNER JOIN rubricas r
      ON r.concurso_id = p.concurso_id
      WHERE p.id = ?
      LIMIT 1
      `,
      [proyectoId]
    );

    if (!rubricas.length) {
      throw new Error(
        'El proyecto no tiene una rúbrica configurada'
      );
    }

    const rubricaId = rubricas[0].rubrica_id;

    for (const evaluadorId of evaluadores) {

      const [existe] = await connection.query(
        `
        SELECT id
        FROM evaluaciones
        WHERE proyecto_id = ?
        AND evaluador_id = ?
        `,
        [
          proyectoId,
          evaluadorId
        ]
      );

      if (existe.length > 0) {
        continue;
      }

      await connection.query(
        `
        INSERT INTO evaluaciones
        (
          proyecto_id,
          evaluador_id,
          rubrica_id,
          estado,
          fecha_asignacion
        )
        VALUES (?, ?, ?, 'asignado', NOW())
        `,
        [
          proyectoId,
          evaluadorId,
          rubricaId
        ]
      );
    }
    await connection.commit();
    return true;
  } catch(error) {
    await connection.rollback();
    console.error(
      "ERROR asignarMasivo:",
      error
    );
    throw error;
  } finally {
    connection.release();
  }
}
};

module.exports = EvaluacionService;