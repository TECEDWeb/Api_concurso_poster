const db = require('../config/db');

const logSQL = (query, params) => {
  console.log('\n🟦 SQL QUERY:');
  console.log(query);
  console.log('PARAMS:', params);
};

const ProyectoService = {

  async getAll() {
    const query = `
      SELECT 
        p.id,
        p.concurso_id,
        p.nombre,
        p.descripcion,
        p.activo,
        p.created_at,
        c.nombre AS concurso_nombre
      FROM proyectos p
      LEFT JOIN concursos c ON p.concurso_id = c.id
      ORDER BY p.id DESC
    `;

    logSQL(query, []);

    const [rows] = await db.query(query);

    console.log('📊 getAll rows:', rows.length);

    return rows;
  },

  async getById(id) {
    const query = `SELECT * FROM proyectos WHERE id = ?`;

    logSQL(query, [id]);

    const [rows] = await db.query(query, [id]);

    return rows[0] || null;
  },

  async create(data) {

    console.log('📦 SERVICE CREATE INPUT:', data);

    const { concursoId, nombre, descripcion } = data;

    const query = `
      INSERT INTO proyectos 
        (concurso_id, nombre, descripcion, activo)
      VALUES (?, ?, ?, 1)
    `;

    const params = [
      concursoId || null,
      nombre,
      descripcion || null
    ];

    logSQL(query, params);

    const [result] = await db.query(query, params);

    console.log('🆔 INSERT ID:', result.insertId);

    return {
      id: result.insertId,
      concursoId,
      nombre,
      descripcion,
      activo: 1
    };
  },

  async update(id, data) {

    console.log('📦 UPDATE INPUT:', { id, data });

    const { concursoId, nombre, descripcion, activo } = data;

    const query = `
      UPDATE proyectos 
      SET concurso_id = ?, nombre = ?, descripcion = ?, activo = ?
      WHERE id = ?
    `;

    const params = [
      concursoId,
      nombre,
      descripcion,
      activo,
      id
    ];

    logSQL(query, params);

    await db.query(query, params);

    return true;
  },

  async delete(id) {
    console.log('🗑 DELETE PROJECT:', id);

    const query = `DELETE FROM proyectos WHERE id = ?`;

    logSQL(query, [id]);

    await db.query(query, [id]);

    return true;
  },

  async assignEvaluadores(proyectoId, evaluadoresIds) {

    console.log('👥 ASSIGN EVALUADORES:', { proyectoId, evaluadoresIds });

    await db.query(
      `DELETE FROM proyecto_evaluador WHERE proyecto_id = ?`,
      [proyectoId]
    );

    for (const evaluadorId of evaluadoresIds) {
      await db.query(
        `INSERT INTO proyecto_evaluador (proyecto_id, usuario_id)
         VALUES (?, ?)`,
        [proyectoId, evaluadorId]
      );
    }

    return true;
  }
};

module.exports = ProyectoService;