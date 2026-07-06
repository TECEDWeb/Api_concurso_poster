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
        // VALIDAR DUPLICADO ASIGNACION
        // =====================================

        const [exist] = await connection.query(`
            SELECT id 
            FROM asignaciones
            WHERE proyecto_id = ?
            AND evaluador_id = ?
        `, [
            proyectoId,
            evaluadorId
        ]);


        if (exist.length > 0) {
            throw new Error(
            'Este evaluador ya está asignado a este proyecto'
            );
        }


        // =====================================
        // CREAR ASIGNACION ADMIN
        // =====================================

        const [asignacion] = await connection.query(`
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
        ]);



        // =====================================
        // CREAR EVALUACION REAL
        // =====================================

        const [evaluacion] = await connection.query(`
            INSERT INTO evaluaciones
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
        ]);



        await connection.commit();


        console.log(
            '✅ Asignación creada:',
            asignacion.insertId
        );

        console.log(
            '✅ Evaluación creada:',
            evaluacion.insertId
        );


        return {
            asignacionId: asignacion.insertId,
            evaluacionId: evaluacion.insertId
        };


        } catch(error){

        await connection.rollback();

        console.error(
            'ERROR CREANDO ASIGNACION:',
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