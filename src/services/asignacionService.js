const db = require('../config/db');

const AsignacionService = {

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

  async getProyectos() {
    const [rows] = await db.query(`
      SELECT id, nombre
      FROM proyectos
      ORDER BY nombre
    `);
    return rows;
  },

  async getEvaluadores() {
    const [rows] = await db.query(`
      SELECT id, nombre
      FROM usuarios
      WHERE rol = 'evaluador' AND activo = 1
      ORDER BY nombre
    `);
    return rows;
  },

  async crear(proyectoId, evaluadorId) {
    console.log("========================================");
    console.log("🔵 CREANDO ASIGNACION - MODO FUERZA BRUTA");
    console.log("📌 Proyecto ID:", proyectoId);
    console.log("📌 Evaluador ID:", evaluadorId);
    console.log("========================================");

    // 1. Verificar proyecto
    const [proyectos] = await db.query(
      `SELECT id, concurso_id FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      throw new Error('Proyecto no encontrado');
    }

    const proyecto = proyectos[0];
    console.log("✅ Proyecto encontrado - Concurso ID:", proyecto.concurso_id);

    // 2. Verificar evaluador
    const [evaluadores] = await db.query(
      `SELECT id FROM usuarios WHERE id = ? AND rol = 'evaluador' AND activo = 1`,
      [evaluadorId]
    );

    if (evaluadores.length === 0) {
      throw new Error('Evaluador no encontrado o inactivo');
    }
    console.log("✅ Evaluador encontrado");

    // 3. BUSCAR RÚBRICA - CONSULTA CORREGIDA
    console.log("🔍 Buscando rúbrica para concurso ID:", proyecto.concurso_id);
    const [rubricas] = await db.query(
      `SELECT id FROM rubricas WHERE concurso_id = ? LIMIT 1`,
      [proyecto.concurso_id]
    );

    console.log("📊 Rúbricas encontradas:", rubricas.length);

    if (rubricas.length === 0) {
      throw new Error('El proyecto no tiene rúbrica');
    }

    const rubricaId = rubricas[0].id;
    console.log("✅ Rúbrica ID:", rubricaId);

    // 4. VERIFICAR SECCIONES - CONSULTA CORREGIDA
    console.log("🔍 Verificando secciones para rúbrica ID:", rubricaId);
    const [secciones] = await db.query(
      `SELECT id FROM secciones WHERE rubrica_id = ? LIMIT 1`,
      [rubricaId]
    );

    console.log("📊 Secciones encontradas:", secciones.length);

    if (secciones.length === 0) {
      console.log("⚠️ La rúbrica no tiene secciones, pero continuamos...");
    }

    // 5. VERIFICAR CRITERIOS - CONSULTA CORREGIDA
    console.log("🔍 Verificando criterios para rúbrica ID:", rubricaId);
    const [criterios] = await db.query(
      `SELECT id FROM criterios WHERE rubrica_id = ? LIMIT 1`,
      [rubricaId]
    );

    console.log("📊 Criterios encontrados:", criterios.length);

    if (criterios.length === 0) {
      console.log("⚠️ La rúbrica no tiene criterios, pero continuamos...");
    }

    // 6. VERIFICAR SI YA EXISTE ASIGNACIÓN
    const [existe] = await db.query(
      `SELECT id FROM evaluaciones WHERE proyecto_id = ? AND evaluador_id = ?`,
      [proyectoId, evaluadorId]
    );

    if (existe.length > 0) {
      throw new Error('Ya existe una evaluación para este proyecto y evaluador');
    }

    // 7. CREAR ASIGNACIÓN
    console.log("🔍 Creando asignación...");
    const [resultAsignacion] = await db.query(`
      INSERT INTO asignaciones (proyecto_id, evaluador_id, estado)
      VALUES (?, ?, 'asignado')
    `, [proyectoId, evaluadorId]);

    console.log('✅ Asignación creada con ID:', resultAsignacion.insertId);

    // 8. CREAR EVALUACIÓN
    console.log("🔍 Creando evaluación...");
    const [resultEvaluacion] = await db.query(`
      INSERT INTO evaluaciones (proyecto_id, evaluador_id, rubrica_id, estado, fecha_asignacion)
      VALUES (?, ?, ?, 'asignado', NOW())
    `, [proyectoId, evaluadorId, rubricaId]);

    console.log('✅ Evaluación creada con ID:', resultEvaluacion.insertId);
    console.log("========================================");
    console.log("🎉 ASIGNACIÓN COMPLETADA EXITOSAMENTE");
    console.log("========================================");

    return {
      asignacionId: resultAsignacion.insertId,
      evaluacionId: resultEvaluacion.insertId,
      proyectoId,
      evaluadorId,
      rubricaId
    };
  },

  async eliminar(id) {
    await db.query(`DELETE FROM asignaciones WHERE id = ?`, [id]);
    return true;
  }
};

module.exports = AsignacionService;