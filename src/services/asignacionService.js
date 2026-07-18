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
    console.log("🔵 CREANDO ASIGNACION");
    console.log("📌 Proyecto ID:", proyectoId);
    console.log("📌 Evaluador ID:", evaluadorId);
    console.log("========================================");

    console.log("🔍 PASO 1: Buscando proyecto...");
    const [proyectos] = await db.query(
      `SELECT id, concurso_id FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      console.log("❌ Proyecto no encontrado");
      throw new Error('Proyecto no encontrado');
    }

    const proyecto = proyectos[0];
    console.log("✅ Proyecto encontrado:", proyecto);
    console.log("   - ID:", proyecto.id);
    console.log("   - Concurso ID:", proyecto.concurso_id);

    console.log("🔍 PASO 2: Buscando evaluador...");
    const [evaluadores] = await db.query(
      `SELECT id FROM usuarios WHERE id = ? AND rol = 'evaluador' AND activo = 1`,
      [evaluadorId]
    );

    if (evaluadores.length === 0) {
      console.log("❌ Evaluador no encontrado o inactivo");
      throw new Error('Evaluador no encontrado');
    }
    console.log("✅ Evaluador encontrado:", evaluadores[0]);

    console.log("🔍 PASO 3: Buscando rúbrica para concurso ID:", proyecto.concurso_id);
    const [rubricas] = await db.query(
      `SELECT id, nombre, concurso_id FROM rubricas WHERE concurso_id = ?`,
      [proyecto.concurso_id]
    );

    console.log("📊 Rúbricas encontradas:", rubricas.length);
    if (rubricas.length > 0) {
      console.log("   ✅ Rúbrica encontrada:");
      console.log("   - ID:", rubricas[0].id);
      console.log("   - Nombre:", rubricas[0].nombre);
      console.log("   - Concurso ID:", rubricas[0].concurso_id);
    } else {
      console.log("   ❌ NO se encontraron rúbricas para este concurso");
    }

    if (rubricas.length === 0) {
      throw new Error('El proyecto no tiene rúbrica');
    }

    const rubricaId = rubricas[0].id;

    console.log("🔍 PASO 4: Verificando secciones de la rúbrica ID:", rubricaId);
    const [secciones] = await db.query(
      `SELECT id, nombre FROM secciones WHERE rubrica_id = ?`,
      [rubricaId]
    );

    console.log("📊 Secciones encontradas:", secciones.length);
    if (secciones.length > 0) {
      console.log("   ✅ La rúbrica tiene secciones");
    } else {
      console.log("   ❌ La rúbrica NO tiene secciones configuradas");
      throw new Error('La rúbrica no tiene secciones configuradas. Ve a Rúbricas → Configurar contenido primero.');
    }

    console.log("🔍 PASO 5: Verificando asignación existente...");
    const [existe] = await db.query(
      `SELECT id FROM evaluaciones WHERE proyecto_id = ? AND evaluador_id = ?`,
      [proyectoId, evaluadorId]
    );

    if (existe.length > 0) {
      console.log("❌ Ya existe una evaluación para este proyecto y evaluador");
      throw new Error('Ya existe una evaluación para este proyecto y evaluador');
    }
    console.log("✅ No existe asignación previa");

    console.log("🔍 PASO 6: Creando asignación...");
    const [resultAsignacion] = await db.query(`
      INSERT INTO asignaciones (proyecto_id, evaluador_id, estado)
      VALUES (?, ?, 'asignado')
    `, [proyectoId, evaluadorId]);

    console.log('✅ Asignación creada con ID:', resultAsignacion.insertId);

    console.log("🔍 PASO 7: Creando evaluación...");
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