require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'evaluacion_concursos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // evita problemas de timezone al leer fechas/timestamps
});

// Prueba de conexión al iniciar el servidor (no bloquea el arranque,
// solo avisa en consola si algo está mal configurado).
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos:', process.env.DB_NAME || 'evaluacion_concursos');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
  }
})();

module.exports = pool;
