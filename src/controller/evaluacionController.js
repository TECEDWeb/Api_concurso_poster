const EvaluacionService = require('../services/evaluacionService');

exports.getAll = async (req, res) => {
  try {
    const rows = await EvaluacionService.getTodosResultados();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message });
  }
};

exports.getReporteAdmin = async (req, res) => {
  try {
    const rows = await EvaluacionService.getTodosResultados();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message });
  }
};
exports.getAsignados = async (req, res) => {
  try {
    const id = req.usuario?.id;

    console.log("USER:", req.usuario);

    if (!id) {
      return res.status(401).json({
        ok: false,
        mensaje: 'ID de usuario no encontrado en token'
      });
    }

    const rows = await EvaluacionService.getAsignados(id);

    res.json({ ok: true, data: rows });

  } catch (err) {
    console.error("🔥 ERROR ASIGNADOS:", err);

    res.status(500).json({
      ok: false,
      mensaje: err.message
    });
  }
};

exports.getMisResultados = async (req, res) => {
  try {
    const id = req.usuario?.id;

    if (!id) {
      return res.status(401).json({
        ok: false,
        mensaje: 'No autenticado'
      });
    }

    const rows = await EvaluacionService.getMisResultados(id);

    res.json({ ok: true, data: rows });

  } catch (err) {
    res.status(500).json({
      ok: false,
      mensaje: err.message
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { proyectoId, nota, observacion } = req.body;
    const evaluadorId = req.usuario?.id;   // 🔥 FIX AQUÍ

    if (!evaluadorId) {
      return res.status(401).json({
        ok: false,
        mensaje: 'No autenticado'
      });
    }

    const [asignada] = await require('../config/db').query(
      `SELECT id FROM evaluaciones WHERE evaluador_id = ? AND proyecto_id = ?`,
      [evaluadorId, proyectoId]
    );

    if (!asignada.length) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Evaluación no asignada'
      });
    }

    await EvaluacionService.guardarEvaluacion(
      asignada[0].id,
      nota,
      observacion
    );

    res.json({
      ok: true,
      mensaje: 'Evaluación guardada'
    });

  } catch (err) {
    res.status(500).json({
      ok: false,
      mensaje: err.message
    });
  }
};