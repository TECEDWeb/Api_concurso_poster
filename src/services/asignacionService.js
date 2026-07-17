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

    // ✅ VERIFICAR QUE EXISTA LA RÚBRICA
    const [rubricas] = await db.query(
      `SELECT id FROM rubricas WHERE concurso_id = ?`,
      [proyecto.concurso_id]
    );

    if (rubricas.length === 0) {
      // ⚠️ TEXTO EXACTO que el controller espera para mostrar mensaje amigable
      throw new Error('El proyecto no tiene rúbrica');
    }

    const rubricaId = rubricas[0].id;

    // ✅ VERIFICAR QUE LA RÚBRICA TENGA SECCIONES (CONTENIDO)
    const [secciones] = await db.query(
      `SELECT id FROM secciones WHERE rubrica_id = ? LIMIT 1`,
      [rubricaId]
    );

    if (secciones.length === 0) {
      throw new Error('La rúbrica no tiene secciones configuradas. Ve a Rúbricas → Configurar contenido primero.');
    }

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