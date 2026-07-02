const db = require('../config/db');

const criteriosController = {

  /**
   * GET /api/criterios
   */
  async getAll(req, res) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM criterios ORDER BY id DESC'
      );

      return res.json({
        ok: true,
        data: rows
      });

    } catch (error) {
      console.error('ERROR getAll criterios:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener criterios'
      });
    }
  },


  /**
   * POST /api/criterios
   */
  async create(req, res) {
    try {
      const { nombre, peso } = req.body;

      if (!nombre || peso == null) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Datos incompletos'
        });
      }

      const [result] = await db.query(
        'INSERT INTO criterios (nombre, peso) VALUES (?, ?)',
        [nombre, peso]
      );

      return res.status(201).json({
        ok: true,
        mensaje: 'Criterio creado correctamente',
        data: {
          id: result.insertId,
          nombre,
          peso
        }
      });

    } catch (error) {
      console.error('ERROR create criterios:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear criterio'
      });
    }
  },


  /**
   * PUT /api/criterios/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, peso } = req.body;

      const [result] = await db.query(
        'UPDATE criterios SET nombre=?, peso=? WHERE id=?',
        [nombre, peso, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Criterio no encontrado'
        });
      }

      return res.json({
        ok: true,
        mensaje: 'Criterio actualizado correctamente',
        data: { id }
      });

    } catch (error) {
      console.error('ERROR update criterios:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar criterio'
      });
    }
  },


  /**
   * DELETE /api/criterios/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const [result] = await db.query(
        'DELETE FROM criterios WHERE id=?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Criterio no encontrado'
        });
      }

      return res.json({
        ok: true,
        mensaje: 'Criterio eliminado correctamente'
      });

    } catch (error) {
      console.error('ERROR delete criterios:', error.message);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar criterio'
      });
    }
  }

};

module.exports = criteriosController;