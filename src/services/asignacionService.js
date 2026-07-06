const db = require('../config/db');

const AsignacionService = {

    // ==========================
    // LISTAR PROYECTOS
    // ==========================
    async getProyectos() {

        const [rows] = await db.query(`
            SELECT
                id,
                nombre
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
            SELECT
                id,
                nombre
            FROM usuarios
            WHERE rol='evaluador'
            ORDER BY nombre
        `);

        return rows;
    },

    // ==========================
    // LISTAR ASIGNACIONES
    // ==========================
    async getAsignaciones() {

        const [rows] = await db.query(`
            SELECT

                e.id,

                p.nombre proyecto,

                u.nombre evaluador,

                e.estado

            FROM evaluaciones e

            INNER JOIN proyectos p
                ON p.id=e.proyecto_id

            INNER JOIN usuarios u
                ON u.id=e.evaluador_id

            ORDER BY p.nombre
        `);

        return rows;

    },

    // ==========================
    // CREAR ASIGNACIÓN
    // ==========================
    async crear(proyectoId,evaluadorId){

        // evitar duplicados

        const [existe] = await db.query(`
            SELECT id
            FROM evaluaciones
            WHERE proyecto_id=?
            AND evaluador_id=?
        `,[proyectoId,evaluadorId]);

        if(existe.length){

            throw new Error('Este proyecto ya está asignado a ese evaluador');

        }

        const [result]=await db.query(`
            INSERT INTO evaluaciones
            (
                proyecto_id,
                evaluador_id,
                estado
            )
            VALUES
            (
                ?,
                ?,
                'asignado'
            )
        `,[proyectoId,evaluadorId]);

        return result.insertId;

    },

    // ==========================
    // ELIMINAR
    // ==========================
    async eliminar(id){

        await db.query(
            `DELETE FROM evaluaciones WHERE id=?`,
            [id]
        );

        return true;

    }

};

module.exports = AsignacionService;