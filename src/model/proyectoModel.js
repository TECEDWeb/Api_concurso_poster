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

  // ✅ ACTUALIZADO: Agregado codigo_proyecto, participantes opcionales
  async create({ 
    nombre, 
    descripcion, 
    concursoId, 
    codigoProyecto,  // NUEVO
    participantes = [], // Opcional
    tutores = []     // Opcional
  }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Generar código automático si no se proporciona
      let codigo = codigoProyecto;
      if (!codigo) {
        // Obtener el último ID para generar código secuencial
        const [maxId] = await connection.query(`SELECT MAX(id) as maxId FROM proyectos`);
        const nextId = (maxId[0].maxId || 0) + 1;
        codigo = `PROJ-${String(nextId).padStart(4, '0')}`;
      }

      const [result] = await connection.query(`
        INSERT INTO proyectos (nombre, descripcion, concurso_id, codigo_proyecto, activo)
        VALUES (?, ?, ?, ?, 1)
      `, [
        nombre,
        descripcion || null,
        concursoId || null,
        codigo
      ]);

      const proyectoId = result.insertId;

      // ✅ Insertar participantes SOLO si hay (opcional)
      if (participantes && participantes.length > 0) {
        for (const nombreParticipante of participantes.filter(n => n && n.trim())) {
          await connection.query(
            `INSERT INTO participantes (proyecto_id, nombre) VALUES (?, ?)`,
            [proyectoId, nombreParticipante.trim()]
          );
        }
      }

      // ✅ Insertar tutores SOLO si hay (opcional)
      if (tutores && tutores.length > 0) {
        const tutoresFiltrados = tutores.filter(t => t && t.trim()).slice(0, 4);
        for (let i = 0; i < tutoresFiltrados.length; i++) {
          await connection.query(
            `INSERT INTO tutores (proyecto_id, nombre, encargado) VALUES (?, ?, ?)`,
            [proyectoId, tutoresFiltrados[i].trim(), i === 0 ? 1 : 0]
          );
        }
      }

      await connection.commit();

      return {
        id: proyectoId,
        nombre,
        descripcion,
        concursoId,
        codigoProyecto: codigo,
        participantes: participantes || [],
        tutores: tutores || []
      };

    } catch (error) {
      await connection.rollback();
      console.error('❌ ERROR en create proyecto:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // ✅ ACTUALIZADO: Agregado codigo_proyecto
  async update(id, { 
    nombre, 
    descripcion, 
    nivel, 
    area,
    activo,
    codigoProyecto,
    participantes,
    tutores
  }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Si no hay codigoProyecto, mantener el existente
      let codigo = codigoProyecto;
      if (!codigo) {
        const [existing] = await connection.query(
          `SELECT codigo_proyecto FROM proyectos WHERE id = ?`,
          [id]
        );
        codigo = existing[0]?.codigo_proyecto;
      }

      await connection.query(`
        UPDATE proyectos
        SET nombre = ?, descripcion = ?, nivel = ?, area = ?, activo = ?, codigo_proyecto = ?
        WHERE id = ?
      `, [nombre, descripcion, nivel, area, activo, codigo, id]);

      // Reemplazar participantes SOLO si se proporcionan
      if (participantes !== undefined) {
        await connection.query(`DELETE FROM participantes WHERE proyecto_id = ?`, [id]);
        const listaParticipantes = (participantes || []).filter(n => n && n.trim());
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
        const listaTutores = (tutores || []).filter(t => t && t.trim()).slice(0, 4);
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
      console.error('❌ ERROR en update proyecto:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Elimina un proyecto y TODO lo que depende de él, en cascada,
   * dentro de una transacción.
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

      // 4. Borrar participantes y tutores
      await connection.query(`DELETE FROM participantes WHERE proyecto_id = ?`, [id]);
      await connection.query(`DELETE FROM tutores WHERE proyecto_id = ?`, [id]);

      // 5. Finalmente, borrar el proyecto
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