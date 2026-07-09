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

    // 1. Verificar que el proyecto existe
    const [proyectos] = await db.query(
      `SELECT id, concurso_id FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      throw new Error('Proyecto no encontrado');
    }

    const proyecto = proyectos[0];

    // 2. Verificar que el evaluador existe
    const [evaluadores] = await db.query(
      `SELECT id FROM usuarios WHERE id = ? AND rol = 'evaluador'`,
      [evaluadorId]
    );

    if (evaluadores.length === 0) {
      throw new Error('Evaluador no encontrado');
    }

    // 3. Buscar si el proyecto tiene rúbrica
    let [rubricas] = await db.query(
      `SELECT id FROM rubricas WHERE concurso_id = ?`,
      [proyecto.concurso_id]
    );

    let rubricaId;

    if (rubricas.length === 0) {
      console.log('⚠️ El proyecto no tiene rúbrica, creando una automáticamente...');
      
      // 3a. Crear rúbrica por defecto
      const [resultRubrica] = await db.query(`
        INSERT INTO rubricas (concurso_id, nombre, puntaje_maximo, estado)
        VALUES (?, ?, ?, ?)
      `, [proyecto.concurso_id, `Rúbrica para concurso ${proyecto.concurso_id}`, 100, 'ACTIVA']);

      rubricaId = resultRubrica.insertId;
      console.log('✅ Rúbrica creada con ID:', rubricaId);

      // 3b. Crear secciones por defecto
      const secciones = [
        { nombre: 'Contenido', orden: 1 },
        { nombre: 'Presentación', orden: 2 },
        { nombre: 'Originalidad', orden: 3 }
      ];

      for (const seccion of secciones) {
        const [seccionResult] = await db.query(`
          INSERT INTO secciones (concurso_id, nombre, orden)
          VALUES (?, ?, ?)
        `, [proyecto.concurso_id, seccion.nombre, seccion.orden]);

        // 3c. Crear criterios por defecto para cada sección
        const criterios = [
          { texto: `Calidad del ${seccion.nombre}`, orden: 1 },
          { texto: `Relevancia del ${seccion.nombre}`, orden: 2 }
        ];

        for (const criterio of criterios) {
          await db.query(`
            INSERT INTO criterios (seccion_id, rubrica_id, texto, orden)
            VALUES (?, ?, ?, ?)
          `, [seccionResult.insertId, rubricaId, criterio.texto, criterio.orden]);
        }
      }

      // 3d. Crear niveles por defecto
      const niveles = [
        { nombre: 'Bajo', puntaje: 1 },
        { nombre: 'Medio', puntaje: 2 },
        { nombre: 'Alto', puntaje: 3 }
      ];

      for (const nivel of niveles) {
        await db.query(`
          INSERT INTO niveles (concurso_id, nombre, puntaje)
          VALUES (?, ?, ?)
        `, [proyecto.concurso_id, nivel.nombre, nivel.puntaje]);
      }

      console.log('✅ Rúbrica completa creada automáticamente');
    } else {
      rubricaId = rubricas[0].id;
      console.log('✅ Rúbrica existente encontrada con ID:', rubricaId);
    }

    // 4. Verificar si ya existe la asignación
    const [existe] = await db.query(
      `SELECT id FROM evaluaciones WHERE proyecto_id = ? AND evaluador_id = ?`,
      [proyectoId, evaluadorId]
    );

    if (existe.length > 0) {
      throw new Error('Ya existe una evaluación para este proyecto y evaluador');
    }

    // 5. Insertar en la tabla asignaciones
    const [resultAsignacion] = await db.query(`
      INSERT INTO asignaciones (proyecto_id, evaluador_id, estado)
      VALUES (?, ?, 'asignado')
    `, [proyectoId, evaluadorId]);

    console.log('✅ Asignación creada con ID:', resultAsignacion.insertId);

    // 6. Insertar en la tabla evaluaciones
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