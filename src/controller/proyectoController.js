const ProyectoService = require('../services/proyectoService');

const log = (title, data) => {
  console.log('\n==============================');
  console.log(title);
  console.log(JSON.stringify(data, null, 2));
  console.log('==============================\n');
};

const proyectoController = {

  /**
   * GET /api/proyectos
   */
  async getAll(req, res) {
    try {
      console.log('📥 GET /proyectos');

      const data = await ProyectoService.getAll();

      const safeData = data || [];

      console.log('✅ Proyectos obtenidos:', safeData.length);

      return res.json({
        ok: true,
        data: safeData
      });

    } catch (err) {
      console.error('❌ ERROR getAll proyectos:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener proyectos'
      });
    }
  },


  /**
   * GET /api/proyectos/:id
   */
  async getById(req, res) {
    try {
      console.log('📥 GET BY ID:', req.params.id);

      const data = await ProyectoService.getById(req.params.id);

      if (!data) {
        return res.status(404).json({
          ok: false,
          mensaje: 'Proyecto no encontrado'
        });
      }

      return res.json({
        ok: true,
        data
      });

    } catch (err) {
      console.error('❌ ERROR getById proyecto:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener proyecto'
      });
    }
  },


  /**
   * POST /api/proyectos
   */
  async create(req, res) {
    const start = Date.now();

    console.log('\n==============================');
    console.log('📥 CREATE PROYECTO');
    console.log('BODY:', req.body);
    console.log('==============================');

    try {
      const nuevo = await ProyectoService.create(req.body);

      console.log('✅ PROYECTO CREADO');
      console.log('⏱ ms:', Date.now() - start);

      return res.status(201).json({
        ok: true,
        data: nuevo
      });

    } catch (err) {
      console.error('❌ ERROR CREATE PROYECTO:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al crear proyecto'
      });
    }
  },


  /**
   * PUT /api/proyectos/:id
   */
  async update(req, res) {
    try {
      console.log('📥 UPDATE:', req.params.id);

      await ProyectoService.update(req.params.id, req.body);

      return res.json({
        ok: true,
        mensaje: 'Proyecto actualizado'
      });

    } catch (err) {
      console.error('❌ ERROR update proyecto:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al actualizar proyecto'
      });
    }
  },


  /**
   * DELETE /api/proyectos/:id
   */
  async remove(req, res) {
    try {
      console.log('📥 DELETE:', req.params.id);

      await ProyectoService.delete(req.params.id);

      return res.json({
        ok: true,
        mensaje: 'Proyecto eliminado'
      });

    } catch (err) {
      console.error('❌ ERROR delete proyecto:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al eliminar proyecto'
      });
    }
  },


  /**
   * POST /api/proyectos/:id/evaluadores
   */
  async assignEvaluadores(req, res) {
    try {
      const { evaluadoresIds } = req.body;

      if (!Array.isArray(evaluadoresIds)) {
        return res.status(400).json({
          ok: false,
          mensaje: 'evaluadoresIds debe ser un array'
        });
      }

      await ProyectoService.assignEvaluadores(
        req.params.id,
        evaluadoresIds
      );

      return res.json({
        ok: true,
        mensaje: 'Evaluadores asignados'
      });

    } catch (err) {
      console.error('❌ ERROR assign evaluadores:', err);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al asignar evaluadores'
      });
    }
  }

};

module.exports = proyectoController;