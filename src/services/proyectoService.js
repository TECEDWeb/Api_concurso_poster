const db = require('../config/db');

const ProyectoService = {

  async getAll() {
    const query = `
      SELECT 
        p.id,
        p.concurso_id,
        p.nombre,
        p.descripcion,
        p.estudiante_nombre,
        p.nivel,
        p.area,
        p.activo,
        p.created_at,
        c.nombre AS concurso_nombre
      FROM proyectos p
      LEFT JOIN concursos c ON p.concurso_id = c.id
      ORDER BY p.id DESC
    `;

    const [rows] = await db.query(query);
    return rows;
  },

  async getById(id) {
    const query = `
      SELECT 
        p.*,
        c.nombre AS concurso_nombre
      FROM proyectos p
      LEFT JOIN concursos c ON p.concurso_id = c.id
      WHERE p.id = ?
    `;

    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const { concurso_id, nombre, descripcion, estudiante_nombre, nivel, area, activo } = data;

    if (!estudiante_nombre || estudiante_nombre.trim() === '') {
      throw new Error('El nombre del estudiante es obligatorio');
    }

    const query = `
      INSERT INTO proyectos 
        (concurso_id, nombre, descripcion, estudiante_nombre, nivel, area, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      concurso_id || null,
      nombre.trim(),
      descripcion || null,
      estudiante_nombre.trim(),
      nivel || null,
      area || null,
      activo !== undefined ? activo : 1
    ];

    const [result] = await db.query(query, params);

    return {
      id: result.insertId,
      concurso_id,
      nombre,
      descripcion,
      estudiante_nombre,
      nivel,
      area,
      activo: activo !== undefined ? activo : 1
    };
  },

  async update(id, data) {
    const { concurso_id, nombre, descripcion, estudiante_nombre, nivel, area, activo } = data;

    const query = `
      UPDATE proyectos 
      SET concurso_id = ?, nombre = ?, descripcion = ?, estudiante_nombre = ?, nivel = ?, area = ?, activo = ?
      WHERE id = ?
    `;

    const params = [
      concurso_id || null,
      nombre || '',
      descripcion || null,
      estudiante_nombre || '',
      nivel || null,
      area || null,
      activo !== undefined ? activo : 1,
      id
    ];

    await db.query(query, params);
    return true;
  },

  /**
   * Elimina un proyecto y TODO lo que depende de él, en cascada,
   * dentro de una transacción: detalles_evaluacion -> evaluaciones
   * -> asignaciones -> proyectos. Si cualquier paso falla, se revierte
   * todo (rollback), evitando dejar registros huérfanos.
   */
  async delete(id) {
    const connection = await db.getConnection();

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
  }
};

module.exports = ProyectoService;