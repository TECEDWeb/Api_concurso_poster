const ProyectoService = require('../services/proyectoService');

const log = (title, data) => {
  console.log('\n==============================');
  console.log(title);
  console.log(JSON.stringify(data, null, 2));
  console.log('==============================\n');
};

exports.getAll = async (req, res) => {
  try {
    console.log('📥 GET /proyectos');

    const data = await ProyectoService.getAll();

    console.log('✅ Proyectos obtenidos:', data.length);

    res.json({ ok: true, data });

  } catch (err) {
    console.error('❌ ERROR getAll:', err);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    console.log('📥 GET BY ID:', req.params.id);

    const data = await ProyectoService.getById(req.params.id);

    if (!data) {
      console.log('⚠️ Proyecto no encontrado');
      return res.status(404).json({ ok: false, mensaje: 'No encontrado' });
    }

    res.json({ ok: true, data });

  } catch (err) {
    console.error('❌ ERROR getById:', err);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
};

exports.create = async (req, res) => {
  const start = Date.now();

  console.log('\n==============================');
  console.log('📥 CREATE PROYECTO');
  console.log('BODY:', req.body);
  console.log('==============================');

  try {
    const nuevo = await ProyectoService.create(req.body);

    console.log('==============================');
    console.log('✅ PROYECTO CREADO');
    console.log('RESULTADO:', nuevo);
    console.log('⏱ Tiempo(ms):', Date.now() - start);
    console.log('==============================');

    res.status(201).json({ ok: true, data: nuevo });

  } catch (err) {
    console.log('==============================');
    console.error('❌ ERROR CREATE PROYECTO');
    console.error('MESSAGE:', err.message);
    console.error('CODE:', err.code);
    console.error('STACK:', err.stack);
    console.log('==============================');

    res.status(500).json({ ok: false, mensaje: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    console.log('📥 UPDATE:', req.params.id, req.body);

    await ProyectoService.update(req.params.id, req.body);

    console.log('✅ UPDATE OK');

    res.json({ ok: true });

  } catch (err) {
    console.error('❌ ERROR update:', err);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    console.log('📥 DELETE:', req.params.id);

    await ProyectoService.delete(req.params.id);

    console.log('✅ DELETE OK');

    res.json({ ok: true });

  } catch (err) {
    console.error('❌ ERROR delete:', err);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
};

exports.assignEvaluadores = async (req, res) => {
  try {
    const { evaluadoresIds } = req.body;

    if (!Array.isArray(evaluadoresIds)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'evaluadoresIds debe ser un array'
      });
    }

    await ProyectoService.assignEvaluadores(req.params.id, evaluadoresIds);

    res.json({ ok: true, mensaje: 'Evaluadores asignados' });

  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message });
  }
};