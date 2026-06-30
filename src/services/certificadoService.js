const db = require('../config/db');

const CertificadoService = {

  async getAll() {
    const [rows] = await db.query('SELECT * FROM certificados');
    return rows;
  },

  async validar(id) {
    await db.query(
      'UPDATE certificados SET validado=1 WHERE id=?',
      [id]
    );
    return true;
  },

  async regenerar(id) {
    // aquí luego conectamos PDF
    return { message: 'Certificado regenerado' };
  }
};

module.exports = CertificadoService;