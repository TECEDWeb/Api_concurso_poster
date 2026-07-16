const pool = require('../config/db');

const proyectoModel = {

  async getAll() {
    const [rows] = await pool.query(`
      SELECT * FROM proyectos ORDER BY id DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT * FROM proyectos WHERE id = ? LIMIT 1
    `, [id]);

    return rows[0] || null;
  },

  async create({ nombre, descripcion, concursoId }) {
    const [result] = await pool.query(`
      INSERT INTO proyectos (nombre, descripcion, concurso_id, activo)
      VALUES (?, ?, ?, 1)
    `, [
      nombre,
      descripcion || null,
      concursoId
    ]);

    return {
      id: result.insertId,
      nombre,
      descripcion,
      concursoId
    };
  },

  async update(id, { nombre, descripcion, nivel, activo }) {
    await pool.query(`
      UPDATE proyectos
      SET nombre = ?, descripcion = ?, nivel = ?, activo = ?
      WHERE id = ?
    `, [nombre, descripcion, nivel, activo, id]);

    return true;
  },

  /**
   * Elimina un proyecto y TODO lo que depende de él, en cascada,
   * dentro de una transacción: detalles_evaluacion -> evaluaciones
   * -> asignaciones -> proyectos. Si cualquier paso falla, se revierte
   * todo (rollback), evitando dejar registros huérfanos.
   */
  async remove(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Borrar detalles_evaluacion de las evaluaciones de este proyecto
      await connection.query(
        `DELETE d FROM detalles_evaluacion d
         INNER JOIN evaluaciones e ON e.id = d.evaluacion_id
         WHERE e.proyecto_id = ?`,
        [id]
      );

      // 2. Borrar las evaluaciones del proyecto
      await connection.query(
        `DELETE FROM evaluaciones WHERE proyecto_id = ?`,
        [id]
      );

      // 3. Borrar las asignaciones del proyecto
      await connection.query(
        `DELETE FROM asignaciones WHERE proyecto_id = ?`,
        [id]
      );

      // 4. Finalmente, borrar el proyecto
      await connection.query(
        `DELETE FROM proyectos WHERE id = ?`,
        [id]
      );

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      console.error('❌ ERROR en cascada al eliminar proyecto:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // 🔥 ASIGNACIÓN DE EVALUADORES (TABLA INTERMEDIA)
  async assignEvaluadores(proyectoId, evaluadoresIds) {

    await pool.query(
      `DELETE FROM proyecto_evaluadores WHERE proyecto_id = ?`,
      [proyectoId]
    );

    for (const evaluadorId of evaluadoresIds) {
      await pool.query(
        `INSERT INTO proyecto_evaluadores (proyecto_id, evaluador_id)
         VALUES (?, ?)`,
        [proyectoId, evaluadorId]
      );
    }

    return true;
  }
};

module.exports = proyectoModel;