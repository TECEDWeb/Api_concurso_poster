const db = require('../config/db');

const EvaluacionService = {

  async asignarProyecto(evaluadorId, proyectoId) {
    const [result] = await db.query(
      `INSERT INTO evaluaciones (evaluador_id, proyecto_id, estado)
       VALUES (?, ?, 'asignado')`,
      [evaluadorId, proyectoId]
    );

    return { id: result.insertId };
  },

  async getAsignados(evaluadorId) {
    const [rows] = await db.query(
      `SELECT
          e.id AS evaluacionId,
          e.estado,
          p.id AS proyectoId,
          p.nombre AS proyectoNombre,
          p.descripcion AS proyectoDescripcion,
          c.tipo,
          c.fecha_inicio,
          c.fecha_fin,
          c.puntaje_maximo
       FROM evaluaciones e
       JOIN proyectos p ON e.proyecto_id = p.id
       LEFT JOIN concursos c ON p.concurso_id = c.id
       WHERE e.evaluador_id = ?`,
      [evaluadorId]
    );

    return rows.map(r => ({
      evaluacionId: r.evaluacionId,
      yaEvaluado: r.estado === 'evaluado',
      puedeEditar: r.fecha_fin
        ? new Date(r.fecha_fin) > new Date()
        : true,

      proyecto: {
        id: r.proyectoId,
        nombre: r.proyectoNombre,
        descripcion: r.proyectoDescripcion,
        tipo: r.tipo ?? null,
        puntajeMaximo: r.puntaje_maximo ?? null,
        participantes: []
      }
    }));
  },

  async guardarEvaluacion(evaluacionId, nota, observacion) {
    await db.query(
      `UPDATE evaluaciones
       SET nota=?, observaciones=?, estado='evaluado'
       WHERE id=?`,
      [nota, observacion, evaluacionId]
    );
  },

  async getMisResultados(evaluadorId) {
    const [rows] = await db.query(
      `SELECT p.nombre, e.nota, e.observaciones
       FROM evaluaciones e
       JOIN proyectos p ON e.proyecto_id = p.id
       WHERE e.evaluador_id = ? AND e.estado='evaluado'`,
      [evaluadorId]
    );

    return rows;
  },

  async getTodosResultados() {
    const [rows] = await db.query(
      `SELECT e.id, p.nombre, u.nombre AS evaluador, e.nota, e.estado
       FROM evaluaciones e
       JOIN proyectos p ON e.proyecto_id = p.id
       JOIN usuarios u ON e.evaluador_id = u.id`
    );

    return rows;
  },

  async getResumenEvaluador() {
  const [rows] = await db.query(
    `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'evaluado' THEN 1 ELSE 0 END) AS completados,
        SUM(CASE WHEN estado = 'asignado' THEN 1 ELSE 0 END) AS pendientes
     FROM evaluaciones`
  );

  return rows[0];
}
};

module.exports = EvaluacionService;