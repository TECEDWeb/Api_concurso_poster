const db = require('../config/db');

const certificadosController = {

  /**
   * GET /api/certificados
   */
  async getAll(req, res) {
    try {
      console.log('GET CERTIFICADOS');

      const [rows] = await db.query(
        'SELECT * FROM certificados ORDER BY id DESC'
      );

      return res.json({
        ok: true,
        data: rows
      });

    } catch (error) {
      console.error('ERROR getAll certificados:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener certificados'
      });
    }
  },


  /**
   * PUT /api/certificados/:id/validar
   */
  async validar(req, res) {
    try {
      const { id } = req.params;

      console.log('VALIDAR CERTIFICADO:', id);

      const [result] = await db.query(
        'UPDATE certificados SET validado = 1 WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Certificado no encontrado'
        });
      }

      return res.json({
        ok: true,
        mensaje: 'Certificado validado correctamente',
        data: { id }
      });

    } catch (error) {
      console.error('ERROR validar certificado:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al validar certificado'
      });
    }
  },


  /**
   * POST /api/certificados/:id/regenerar
   */
  async regenerar(req, res) {
    try {
      const { id } = req.params;

      console.log('REGENERAR CERTIFICADO:', id);

      // Aquí luego puedes conectar PDF generator
      return res.json({
        ok: true,
        mensaje: 'Certificado regenerado (pendiente PDF)',
        data: { id }
      });

    } catch (error) {
      console.error('ERROR regenerar certificado:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al regenerar certificado'
      });
    }
  }

};

module.exports = certificadosController;