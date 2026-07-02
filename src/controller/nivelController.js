const db = require('../config/db');

const nivelesController = {

  /**
   * GET /api/niveles
   */
  async getAll(req, res) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM niveles ORDER BY id DESC'
      );

      return res.json({
        ok: true,
        data: rows || []
      });

    } catch (error) {
      console.error('ERROR getAll niveles:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener niveles'
      });
    }
  },


  /**
   * POST /api/niveles
   */
  async create(req, res) {
    try {
      const { nombre } = req.body;

      if (!nombre) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Nombre es obligatorio'
        });
      }

      const [result] = await db.query(
        'INSERT INTO niveles (nombre) VALUES (?)',
        [nombre]
      );

      return res.status(201).json({
        ok: true,
        mensaje: 'Nivel creado correctamente',
        data: {
          id: result.insertId,
          nombre
        }
      });

    } catch (error) {
      console.error('ERROR create nivel:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear nivel'
      });
    }
  },


  /**
   * PUT /api/niveles/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;

      const [result] = await db.query(
        'UPDATE niveles SET nombre=? WHERE id=?',
        [nombre, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Nivel no encontrado'
        });
      }

      return res.json({
        ok: true,
        mensaje: 'Nivel actualizado correctamente'
      });

    } catch (error) {
      console.error('ERROR update nivel:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar nivel'
      });
    }
  },


  /**
   * DELETE /api/niveles/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const [result] = await db.query(
        'DELETE FROM niveles WHERE id=?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Nivel no encontrado'
        });
      }

      return res.json({
        ok: true,
        mensaje: 'Nivel eliminado correctamente'
      });

    } catch (error) {
      console.error('ERROR delete nivel:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar nivel'
      });
    }
  }

};

module.exports = nivelesController;