const db = require('../config/db');

const AsignacionService = {

  // ==========================
  // LISTAR ASIGNACIONES
  // ==========================
  async getAsignaciones() {
    const [rows] = await db.query(`
      SELECT
        a.id,
        p.nombre AS proyecto,
        u.nombre AS evaluador,
        a.estado,
        a.created_at
      FROM asignaciones a
      INNER JOIN proyectos p ON p.id = a.proyecto_id
      INNER JOIN usuarios u ON u.id = a.evaluador_id
      ORDER BY a.created_at DESC
    `);

    return rows;
  },

  // ==========================
  // LISTAR PROYECTOS
  // ==========================
  async getProyectos() {
    const [rows] = await db.query(`
      SELECT id, nombre
      FROM proyectos
      ORDER BY nombre
    `);

    return rows;
  },

  // ==========================
  // LISTAR EVALUADORES
  // ==========================
  async getEvaluadores() {
    const [rows] = await db.query(`
      SELECT id, nombre
      FROM usuarios
      WHERE rol = 'evaluador'
      ORDER BY nombre
    `);

    return rows;
  },

  // ==========================
  // CREAR ASIGNACIÓN - CORREGIDO
  // ==========================
  async crear(proyectoId, evaluadorId) {
    console.log("🔵 CREANDO ASIGNACION");
    console.log({ proyectoId, evaluadorId });

    const [proyectos] = await db.query(
      `SELECT id, concurso_id FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      throw new Error('Proyecto no encontrado');
    }

    const proyecto = proyectos[0];

    const [evaluadores] = await db.query(
      `SELECT id FROM usuarios WHERE id = ? AND rol = 'evaluador'`,
      [evaluadorId]
    );

    if (evaluadores.length === 0) {
      throw new Error('Evaluador no encontrado');
    }

    // La rúbrica del concurso debe existir y estar configurada
    // (secciones/criterios/niveles) ANTES de poder asignar evaluadores.
    // Ya no se auto-genera contenido de relleno: eso generaba criterios
    // genéricos sin relación real con el concurso, y podía duplicar
    // rúbricas violando el constraint único en rubricas.concurso_id.
    const [rubricas] = await db.query(
      `SELECT id FROM rubricas WHERE concurso_id = ?`,
      [proyecto.concurso_id]
    );

    if (rubricas.length === 0) {
      throw new Error(
        'Este concurso no tiene una rúbrica configurada. Ve a Rúbricas → Configurar contenido antes de asignar evaluadores.'
      );
    }

    const rubricaId = rubricas[0].id;

    const [existe] = await db.query(
      `SELECT id FROM evaluaciones WHERE proyecto_id = ? AND evaluador_id = ?`,
      [proyectoId, evaluadorId]
    );

    if (existe.length > 0) {
      throw new Error('Ya existe una evaluación para este proyecto y evaluador');
    }

    const [resultAsignacion] = await db.query(`
      INSERT INTO asignaciones (proyecto_id, evaluador_id, estado)
      VALUES (?, ?, 'asignado')
    `, [proyectoId, evaluadorId]);

    console.log('✅ Asignación creada con ID:', resultAsignacion.insertId);

    const [resultEvaluacion] = await db.query(`
      INSERT INTO evaluaciones (proyecto_id, evaluador_id, rubrica_id, estado, fecha_asignacion)
      VALUES (?, ?, ?, 'asignado', NOW())
    `, [proyectoId, evaluadorId, rubricaId]);

    console.log('✅ Evaluación creada con ID:', resultEvaluacion.insertId);

    return {
      asignacionId: resultAsignacion.insertId,
      evaluacionId: resultEvaluacion.insertId,
      proyectoId,
      evaluadorId,
      rubricaId
    };
  },

  // ==========================
  // ELIMINAR ASIGNACIÓN
  // ==========================
  async eliminar(id) {
    await db.query(`DELETE FROM asignaciones WHERE id = ?`, [id]);
    return true;
  }
};

module.exports = AsignacionService;