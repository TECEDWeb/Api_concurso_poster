require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(` DB conectada: ${process.env.DB_NAME} en ${process.env.DB_HOST}`);
    connection.release();
  } catch (error) {
    console.error(' Error al conectar a la base de datos:', error.message);
  }
})();

module.exports = pool;