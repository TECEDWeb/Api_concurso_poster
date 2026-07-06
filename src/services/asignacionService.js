const db = require('../config/db');

const AsignacionService = {

  // ==========================
  // LISTAR ASIGNACIONES
  // ==========================
  async getAsignaciones() {
    const [rows] = await db.query(`
      SELECT
        a.id,
        p.nombre AS proyecto,
        u.nombre AS evaluador,
        a.estado,
        a.created_at
      FROM asignaciones a
      INNER JOIN proyectos p ON p.id = a.proyecto_id
      INNER JOIN usuarios u ON u.id = a.evaluador_id
      ORDER BY a.created_at DESC
    `);

    return rows;
  },

  // ==========================
  // LISTAR PROYECTOS
  // ==========================
  async getProyectos() {
    const [rows] = await db.query(`
      SELECT id, nombre
      FROM proyectos
      ORDER BY nombre
    `);

    return rows;
  },

  // ==========================
  // LISTAR EVALUADORES
  // ==========================
  async getEvaluadores() {
    const [rows] = await db.query(`
      SELECT id, nombre
      FROM usuarios
      WHERE rol = 'evaluador'
      ORDER BY nombre
    `);

    return rows;
  },

  // ==========================
  // CREAR ASIGNACIÓN
  // ==========================
  async crear(proyectoId, evaluadorId) {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();


        // =====================================
        // VALIDAR DUPLICADO
        // =====================================

        const [existente] = await connection.query(
        `
        SELECT id
        FROM asignaciones
        WHERE proyecto_id = ?
        AND evaluador_id = ?
        `,
        [
            proyectoId,
            evaluadorId
        ]
        );


        if (existente.length > 0) {

        throw new Error(
            'Este evaluador ya está asignado a este proyecto'
        );

        }



        // =====================================
        // CREAR ASIGNACION
        // =====================================

        const [asignacion] = await connection.query(
        `
        INSERT INTO asignaciones
        (
            proyecto_id,
            evaluador_id,
            estado
        )
        VALUES (?, ?, 'asignado')
        `,
        [
            proyectoId,
            evaluadorId
        ]
        );



        // =====================================
        // BUSCAR RUBRICA DEL PROYECTO
        // =====================================

        const [rubrica] = await connection.query(
        `
        SELECT 
            r.id AS rubrica_id

        FROM proyectos p

        INNER JOIN rubricas r
        ON r.concurso_id = p.concurso_id

        WHERE p.id = ?

        LIMIT 1
        `,
        [
            proyectoId
        ]
        );


        if (!rubrica.length) {

        throw new Error(
            'El proyecto no tiene una rúbrica configurada'
        );

        }



        const rubricaId = rubrica[0].rubrica_id;



        // =====================================
        // CREAR EVALUACION
        // =====================================

        const [evaluacion] = await connection.query(
        `
        INSERT INTO evaluaciones
        (
            proyecto_id,
            evaluador_id,
            rubrica_id,
            estado
        )
        VALUES (?, ?, ?, 'asignado')
        `,
        [
            proyectoId,
            evaluadorId,
            rubricaId
        ]
        );



        await connection.commit();



        console.log(
        '================================'
        );

        console.log(
        '✅ ASIGNACION CREADA:',
        asignacion.insertId
        );

        console.log(
        '✅ EVALUACION CREADA:',
        evaluacion.insertId
        );

        console.log(
        '================================'
        );



        return {
        asignacionId: asignacion.insertId,
        evaluacionId: evaluacion.insertId
        };


    } catch(error) {


        await connection.rollback();


        console.error(
        '❌ ERROR CREANDO ASIGNACION:',
        error
        );


        throw error;


    } finally {


        connection.release();


    }

    },
  // ==========================
  // ELIMINAR ASIGNACIÓN
  // ==========================
  async eliminar(id) {
    await db.query(`
      DELETE FROM asignaciones WHERE id = ?
    `, [id]);

    return true;
  }
};

module.exports = AsignacionService;