const pool = require('../config/db');

const concursoModel = {

  async listar() {
    const [rows] = await pool.query(`
      SELECT *
      FROM concursos
      ORDER BY created_at DESC
    `);
    return rows;
  },

  // Alias para compatibilidad
  async obtenerTodos() {
    return this.listar();
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT *
       FROM concursos
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // Alias para compatibilidad
  async obtenerPorId(id) {
    return this.buscarPorId(id);
  },

  /**
   * Crea el concurso y, en la misma transacción, su rúbrica vacía
   * asociada (secciones y niveles se agregan después desde el
   * constructor de rúbricas). Esto garantiza que TODO concurso nuevo
   * ya nace con una rúbrica lista para configurar, sin que nadie
   * tenga que acordarse de crearla por separado.
   */
  async crear(data) {
    const {
      nombre,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      puntaje_maximo,
      activo
    } = data;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO concursos
        (nombre, descripcion, tipo, fecha_inicio, fecha_fin, puntaje_maximo, activo)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre,
          descripcion || null,
          tipo || null,
          fecha_inicio || null,
          fecha_fin || null,
          puntaje_maximo || null,
          activo ?? true
        ]
      );

      const concursoId = result.insertId;

      // Crear automáticamente la rúbrica vacía de este concurso.
      // Sin secciones ni niveles todavía: eso se configura después
      // desde el constructor de rúbricas en el admin.
      await connection.query(
        `INSERT INTO rubricas (concurso_id, nombre, descripcion, puntaje_maximo, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [
          concursoId,
          `Rúbrica: ${nombre}`,
          null,
          puntaje_maximo || 100,
          'ACTIVA'
        ]
      );

      await connection.commit();

      return concursoId;

    } catch (error) {
      await connection.rollback();
      console.error('❌ ERROR crear concurso (transacción):', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  async actualizar(id, data) {
    const {
      nombre,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      puntaje_maximo,
      activo
    } = data;

    await pool.query(
      `UPDATE concursos
       SET nombre=?,
           descripcion=?,
           tipo=?,
           fecha_inicio=?,
           fecha_fin=?,
           puntaje_maximo=?,
           activo=?
       WHERE id=?`,
      [
        nombre,
        descripcion || null,
        tipo || null,
        fecha_inicio || null,
        fecha_fin || null,
        puntaje_maximo || null,
        activo,
        id
      ]
    );
  },

  /**
   * Elimina el concurso y su rúbrica asociada (con sus secciones/niveles),
   * en cascada dentro de una transacción. Esto evita dejar una rúbrica
   * huérfana apuntando a un concurso que ya no existe.
   */
  async eliminar(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `DELETE c FROM criterios c
         INNER JOIN secciones s ON s.id = c.seccion_id
         WHERE s.concurso_id = ?`,
        [id]
      );

      await connection.query(`DELETE FROM secciones WHERE concurso_id = ?`, [id]);
      await connection.query(`DELETE FROM niveles WHERE concurso_id = ?`, [id]);
      await connection.query(`DELETE FROM rubricas WHERE concurso_id = ?`, [id]);
      await connection.query(`DELETE FROM concursos WHERE id = ?`, [id]);

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      console.error('❌ ERROR eliminar concurso (transacción):', error);
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = concursoModel;