const db = require('../config/db'); // mysql2/promise pool

exports.getAdminStats = async () => {

  try {

    const [usuarios] = await db.query(
      'SELECT COUNT(*) AS total FROM usuarios'
    );

    const [proyectos] = await db.query(
      'SELECT COUNT(*) AS total FROM proyectos'
    );

    const [evaluaciones] = await db.query(
      'SELECT COUNT(*) AS total FROM evaluaciones'
    );

    return {
      usuarios: usuarios[0].total,
      proyectos: proyectos[0].total,
      evaluaciones: evaluaciones[0].total
    };

  } catch (error) {
    console.error('❌ ERROR DASHBOARD SERVICE:', error);
    throw error;
  }
};