const db = require('../config/db');

const MAX_TUTORES = 4;

const ProyectoService = {

  async getAll() {
    const [proyectos] = await db.query(`
      SELECT 
        p.id, p.concurso_id, p.nombre, p.descripcion,
        p.nivel, p.area, p.activo, p.created_at, p.codigo_proyecto,
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

  // ✅ ACTUALIZADO: participantes opcionales
  async create(data) {
    const { 
      concurso_id, 
      nombre, 
      descripcion, 
      nivel, 
      area, 
      activo, 
      codigo_proyecto,  // NUEVO
      participantes = [], 
      tutores = [] 
    } = data;

    const listaParticipantes = (participantes || []).filter(n => n && n.trim());
    const listaTutores = (tutores || []).filter(n => n && n.trim()).slice(0, MAX_TUTORES);

    // ✅ Ya NO forzamos al menos un participante

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Generar código automático si no se proporciona
      let codigo = codigo_proyecto;
      if (!codigo) {
        const [maxId] = await connection.query(`SELECT MAX(id) as maxId FROM proyectos`);
        const nextId = (maxId[0].maxId || 0) + 1;
        codigo = `PROJ-${String(nextId).padStart(4, '0')}`;
      }

      const [result] = await connection.query(
        `INSERT INTO proyectos (concurso_id, nombre, descripcion, nivel, area, activo, codigo_proyecto)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [concurso_id || null, nombre.trim(), descripcion || null, nivel || null, area || null, activo !== undefined ? activo : 1, codigo]
      );

      const proyectoId = result.insertId;

      // ✅ Insertar participantes SOLO si hay
      for (const nombreParticipante of listaParticipantes) {
        await connection.query(
          `INSERT INTO participantes (proyecto_id, nombre) VALUES (?, ?)`,
          [proyectoId, nombreParticipante.trim()]
        );
      }

      // Insertar tutores SOLO si hay
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
      console.error('ERROR create proyecto (transacción):', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // ✅ ACTUALIZADO
  async update(id, data) {
    const { 
      concurso_id, 
      nombre, 
      descripcion, 
      nivel, 
      area, 
      activo, 
      codigo_proyecto,
      participantes, 
      tutores 
    } = data;

    const listaParticipantes = (participantes || []).filter(n => n && n.trim());
    const listaTutores = (tutores || []).filter(n => n && n.trim()).slice(0, MAX_TUTORES);

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE proyectos
         SET concurso_id = ?, nombre = ?, descripcion = ?, nivel = ?, area = ?, activo = ?, codigo_proyecto = ?
         WHERE id = ?`,
        [concurso_id || null, nombre || '', descripcion || null, nivel || null, area || null, activo !== undefined ? activo : 1, codigo_proyecto || null, id]
      );

      // Reemplazar participantes SOLO si se proporcionan
      if (participantes !== undefined) {
        await connection.query(`DELETE FROM participantes WHERE proyecto_id = ?`, [id]);
        for (const nombreParticipante of listaParticipantes) {
          await connection.query(
            `INSERT INTO participantes (proyecto_id, nombre) VALUES (?, ?)`,
            [id, nombreParticipante.trim()]
          );
        }
      }

      // Reemplazar tutores SOLO si se proporcionan
      if (tutores !== undefined) {
        await connection.query(`DELETE FROM tutores WHERE proyecto_id = ?`, [id]);
        for (let i = 0; i < listaTutores.length; i++) {
          await connection.query(
            `INSERT INTO tutores (proyecto_id, nombre, encargado) VALUES (?, ?, ?)`,
            [id, listaTutores[i].trim(), i === 0 ? 1 : 0]
          );
        }
      }

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      console.error('ERROR update proyecto (transacción):', error);
      throw error;
    } finally {
      connection.release();
    }
  },
  
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
      console.error('ERROR en cascada al eliminar proyecto:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = ProyectoService;