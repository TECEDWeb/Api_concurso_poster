const pool = require('../config/db');

const evaluacionModel = {

  async getAll() {
    const [rows] = await pool.query(`
      SELECT * FROM evaluaciones
      ORDER BY id DESC
    `);
    return rows;
  },

  async getByEvaluador(evaluadorId) {
    const [rows] = await pool.query(`
      SELECT e.*, p.nombre AS proyecto_nombre
      FROM evaluaciones e
      JOIN proyectos p ON p.id = e.proyecto_id
      WHERE e.evaluador_id = ?
    `, [evaluadorId]);

    return rows;
  },

  async getByProyecto(proyectoId) {
    const [rows] = await pool.query(`
      SELECT * FROM evaluaciones
      WHERE proyecto_id = ?
    `, [proyectoId]);

    return rows;
  },

  async create({ proyectoId, evaluadorId, criterios }) {

    const promedio = calcularPromedio(criterios);

    const [result] = await pool.query(`
      INSERT INTO evaluaciones
      (proyecto_id, evaluador_id, nota, estado, fecha_evaluacion)
      VALUES (?, ?, ?, 'completado', NOW())
    `, [proyectoId, evaluadorId, promedio]);

    return {
      id: result.insertId,
      proyectoId,
      evaluadorId,
      promedio,
      estado: 'completado'
    };
  },

  async getAsignados(evaluadorId) {
    const [rows] = await pool.query(`
      SELECT
        e.id AS evaluacion_id,
        e.estado,
        p.id AS proyecto_id,
        p.nombre,
        p.descripcion
      FROM evaluaciones e
      JOIN proyectos p ON p.id = e.proyecto_id
      WHERE e.evaluador_id = ?
    `, [evaluadorId]);

    return rows;
  }
};

module.exports = evaluacionModel;