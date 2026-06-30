const pool = require('../config/db');

const evaluacionModel = {

  // 🔹 todas las evaluaciones (admin)
  async getAll() {
    const [rows] = await pool.query(`
      SELECT * FROM evaluaciones
      ORDER BY id DESC
    `);
    return rows;
  },

  // 🔹 evaluaciones por evaluador
  async getByEvaluador(evaluadorId) {
    const [rows] = await pool.query(`
      SELECT e.*, p.nombre AS proyecto_nombre
      FROM evaluaciones e
      JOIN proyectos p ON p.id = e.proyecto_id
      WHERE e.evaluador_id = ?
    `, [evaluadorId]);

    return rows;
  },

  // 🔹 evaluaciones por proyecto
  async getByProyecto(proyectoId) {
    const [rows] = await pool.query(`
      SELECT * FROM evaluaciones
      WHERE proyecto_id = ?
    `, [proyectoId]);

    return rows;
  },

  // 🔹 crear evaluación
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

  // 🔹 asignados al evaluador (IMPORTANTE PARA TU APP)
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