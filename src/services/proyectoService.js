const db = require('../config/db');

const MAX_TUTORES = 4;

const ProyectoService = {

  async getAll() {
    const [proyectos] = await db.query(`
      SELECT 
        p.id, p.concurso_id, p.nombre, p.descripcion,
        p.nivel, p.area, p.activo, p.created_at,
        c.nombre AS concurso_nombre
      FROM proyectos p
      LEFT JOIN concursos c ON p.concurso_id = c.id
      ORDER BY p.id DESC
    `);

    if (proyectos.length === 0) return [];

    const ids = proyectos.map(p => p.id);

    const [participantes] = await db.query(
      `SELECT * FROM participantes WHERE proyecto_id IN (?)`,
      [ids]
    );

    const [tutores] = await db.query(
      `SELECT * FROM tutores WHERE proyecto_id IN (?) ORDER BY encargado DESC, id ASC`,
      [ids]
    );

    return proyectos.map(p => ({
      ...p,
      participantes: participantes.filter(x => x.proyecto_id === p.id),
      tutores: tutores.filter(x => x.proyecto_id === p.id)
    }));
  },

  async getById(id) {
    const [rows] = await db.query(`
      SELECT 
        p.*, c.nombre AS concurso_nombre
      FROM proyectos p
      LEFT JOIN concursos c ON p.concurso_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const proyecto = rows[0];

    const [participantes] = await db.query(
      `SELECT * FROM participantes WHERE proyecto_id = ?`,
      [id]
    );

    const [tutores] = await db.query(
      `SELECT * FROM tutores WHERE proyecto_id = ? ORDER BY encargado DESC, id ASC`,
      [id]
    );

    return { ...proyecto, participantes, tutores };
  },

  /**
   * data.participantes: string[] (nombres, sin jerarquía, sin límite)
   * data.tutores: string[] (nombres; el primero es el "tutor encargado", máximo 4)
   */
  async create(data) {
    const { concurso_id, nombre, descripcion, nivel, area, activo, participantes, tutores } = data;

    const listaParticipantes = (participantes || []).filter(n => n && n.trim());
    const listaTutores = (tutores || []).filter(n => n && n.trim()).slice(0, MAX_TUTORES);

    if (listaParticipantes.length === 0) {
      throw new Error('Debe registrar al menos un participante');
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO proyectos (concurso_id, nombre, descripcion, nivel, area, activo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [concurso_id || null, nombre.trim(), descripcion || null, nivel || null, area || null, activo !== undefined ? activo : 1]
      );

      const proyectoId = result.insertId;

      for (const nombreParticipante of listaParticipantes) {
        await connection.query(
          `INSERT INTO participantes (proyecto_id, nombre) VALUES (?, ?)`,
          [proyectoId, nombreParticipante.trim()]
        );
      }

      for (let i = 0; i < listaTutores.length; i++) {
        await connection.query(
          `INSERT INTO tutores (proyecto_id, nombre, encargado) VALUES (?, ?, ?)`,
          [proyectoId, listaTutores[i].trim(), i === 0 ? 1 : 0]
        );
      }

      await connection.commit();

      return this.getById(proyectoId);

    } catch (error) {
      await connection.rollback();
      console.error('❌ ERROR create proyecto (transacción):', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  async update(id, data) {
    const { concurso_id, nombre, descripcion, nivel, area, activo, participantes, tutores } = data;

    const listaParticipantes = (participantes || []).filter(n => n && n.trim());
    const listaTutores = (tutores || []).filter(n => n && n.trim()).slice(0, MAX_TUTORES);

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE proyectos
         SET concurso_id = ?, nombre = ?, descripcion = ?, nivel = ?, area = ?, activo = ?
         WHERE id = ?`,
        [concurso_id || null, nombre || '', descripcion || null, nivel || null, area || null, activo !== undefined ? activo : 1, id]
      );

      // Reemplazar participantes y tutores por la lista actual (más simple y seguro que hacer diffs)
      await connection.query(`DELETE FROM participantes WHERE proyecto_id = ?`, [id]);
      await connection.query(`DELETE FROM tutores WHERE proyecto_id = ?`, [id]);

      for (const nombreParticipante of listaParticipantes) {
        await connection.query(
          `INSERT INTO participantes (proyecto_id, nombre) VALUES (?, ?)`,
          [id, nombreParticipante.trim()]
        );
      }

      for (let i = 0; i < listaTutores.length; i++) {
        await connection.query(
          `INSERT INTO tutores (proyecto_id, nombre, encargado) VALUES (?, ?, ?)`,
          [id, listaTutores[i].trim(), i === 0 ? 1 : 0]
        );
      }

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      console.error('❌ ERROR update proyecto (transacción):', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Elimina un proyecto y TODO lo que depende de él, en cascada.
   * tutores tiene ON DELETE CASCADE en su FK, pero participantes,
   * evaluaciones y asignaciones se borran explícitamente por seguridad.
   */
  async delete(id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `DELETE d FROM detalles_evaluacion d
         INNER JOIN evaluaciones e ON e.id = d.evaluacion_id
         WHERE e.proyecto_id = ?`,
        [id]
      );

      await connection.query(`DELETE FROM evaluaciones WHERE proyecto_id = ?`, [id]);
      await connection.query(`DELETE FROM asignaciones WHERE proyecto_id = ?`, [id]);
      await connection.query(`DELETE FROM participantes WHERE proyecto_id = ?`, [id]);
      await connection.query(`DELETE FROM tutores WHERE proyecto_id = ?`, [id]);
      await connection.query(`DELETE FROM proyectos WHERE id = ?`, [id]);

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