const db = require('../config/db');

const ProyectoService = {

  async getAll() {
    const query = `
      SELECT 
        p.id,
        p.concurso_id,
        p.nombre,
        p.descripcion,
        p.estudiante_nombre,
        p.activo,
        p.created_at,
        c.nombre AS concurso_nombre
      FROM proyectos p
      LEFT JOIN concursos c ON p.concurso_id = c.id
      ORDER BY p.id DESC
    `;

    console.log('🟦 SQL QUERY:', query);
    console.log('PARAMS: []');

    const [rows] = await db.query(query);

    console.log('📊 getAll rows:', rows.length);
    console.log('✅ Proyectos obtenidos:', rows.length);

    return rows;
  },

  async getById(id) {
    const query = `SELECT * FROM proyectos WHERE id = ?`;

    console.log('🟦 SQL QUERY:', query);
    console.log('PARAMS:', [id]);

    const [rows] = await db.query(query, [id]);

    return rows[0] || null;
  },

  async create(data) {
    console.log('📦 SERVICE CREATE INPUT:', data);

    const { concurso_id, nombre, descripcion, estudiante_nombre, nivel, area, activo } = data;

    // Validar que tenga estudiante_nombre
    if (!estudiante_nombre || estudiante_nombre.trim() === '') {
      throw new Error('El nombre del estudiante es obligatorio');
    }

    const query = `
      INSERT INTO proyectos 
        (concurso_id, nombre, descripcion, estudiante_nombre, activo)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      concurso_id || null,
      nombre.trim(),
      descripcion || null,
      estudiante_nombre.trim(),
      activo !== undefined ? activo : 1
    ];

    console.log('🟦 SQL QUERY:', query);
    console.log('PARAMS:', params);

    const [result] = await db.query(query, params);

    console.log('🆔 INSERT ID:', result.insertId);

    return {
      id: result.insertId,
      concurso_id,
      nombre,
      descripcion,
      estudiante_nombre,
      activo: activo !== undefined ? activo : 1
    };
  },

  async update(id, data) {
    console.log('📦 UPDATE INPUT:', { id, data });

    const { concurso_id, nombre, descripcion, estudiante_nombre, activo } = data;

    const query = `
      UPDATE proyectos 
      SET concurso_id = ?, nombre = ?, descripcion = ?, estudiante_nombre = ?, activo = ?
      WHERE id = ?
    `;

    const params = [
      concurso_id || null,
      nombre || '',
      descripcion || null,
      estudiante_nombre || '',
      activo !== undefined ? activo : 1,
      id
    ];

    console.log('🟦 SQL QUERY:', query);
    console.log('PARAMS:', params);

    await db.query(query, params);

    return true;
  },

  async delete(id) {
    console.log('🗑 DELETE PROJECT:', id);

    const query = `DELETE FROM proyectos WHERE id = ?`;

    console.log('🟦 SQL QUERY:', query);
    console.log('PARAMS:', [id]);

    await db.query(query, [id]);

    return true;
  }
};

module.exports = ProyectoService;