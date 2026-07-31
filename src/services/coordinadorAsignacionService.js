const db = require('../config/db');

const CoordinadorAsignacionService = {

  async listar() {
    const [rows] = await db.query(`
      SELECT
        cc.id,
        cc.concurso_id,
        cc.coordinador_id,
        cc.created_at,
        c.nombre AS concurso_nombre,
        u.nombre AS coordinador_nombre
      FROM concurso_coordinadores cc
      INNER JOIN concursos c ON c.id = cc.concurso_id
      INNER JOIN usuarios u ON u.id = cc.coordinador_id
      ORDER BY cc.created_at DESC
    `);
    return rows;
  },

  async listarCoordinadores() {
    const [rows] = await db.query(`
      SELECT id, nombre, cedula, rol
      FROM usuarios
      WHERE rol = 'coordinador'
      ORDER BY nombre
    `);
    return rows;
  },

  async asignar(concursoId, coordinadorId) {
    const [concurso] = await db.query(`SELECT id FROM concursos WHERE id = ?`, [concursoId]);
    if (concurso.length === 0) {
      throw new Error('Concurso no encontrado');
    }

    const [coordinador] = await db.query(
      `SELECT id FROM usuarios WHERE id = ? AND rol = 'coordinador'`,
      [coordinadorId]
    );
    if (coordinador.length === 0) {
      throw new Error('Coordinador no encontrado');
    }

    const [existe] = await db.query(
      `SELECT id FROM concurso_coordinadores WHERE concurso_id = ? AND coordinador_id = ?`,
      [concursoId, coordinadorId]
    );
    if (existe.length > 0) {
      throw new Error('Este coordinador ya está asignado a este concurso');
    }

    const [result] = await db.query(
      `INSERT INTO concurso_coordinadores (concurso_id, coordinador_id) VALUES (?, ?)`,
      [concursoId, coordinadorId]
    );

    return { id: result.insertId, concursoId, coordinadorId };
  },

  async eliminar(id) {
    await db.query(`DELETE FROM concurso_coordinadores WHERE id = ?`, [id]);
    return true;
  }
};

module.exports = CoordinadorAsignacionService;