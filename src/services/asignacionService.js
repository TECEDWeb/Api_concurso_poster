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
  // CREAR ASIGNACIÓN
  // ==========================
  async crear(proyectoId, evaluadorId) {
    console.log("CREANDO ASIGNACION");
    console.log({
    proyectoId,
    evaluadorId
    });
  const [rubrica] = await db.query(
    `
    SELECT r.id AS rubrica_id
    FROM proyectos p
    INNER JOIN rubricas r
    ON r.concurso_id = p.concurso_id
    WHERE p.id = ?
    LIMIT 1
    `,
    [proyectoId]
  );


  if(!rubrica.length){
    throw new Error(
      "El proyecto no tiene rúbrica"
    );
  }


  const [existe] = await db.query(
    `
    SELECT id
    FROM evaluaciones
    WHERE proyecto_id=?
    AND evaluador_id=?
    `,
    [
      proyectoId,
      evaluadorId
    ]
  );


  if(existe.length){
    throw new Error(
      "Ya existe esta evaluación"
    );
  }


    console.log("Insertando evaluación...");
  const [result] = await db.query(
    
    `
    INSERT INTO evaluaciones
    (
      proyecto_id,
      evaluador_id,
      rubrica_id,
      estado,
      fecha_asignacion
    )
    VALUES (?, ?, ?, 'asignado', NOW())
    `,
    [
      proyectoId,
      evaluadorId,
      rubrica[0].rubrica_id
    ]
  );


  return result.insertId;

}
};

module.exports = AsignacionService;