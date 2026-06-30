const Concurso = require('../model/concursoModel');

exports.listar = async (req, res) => {

  try {

    const concursos = await Concurso.listar();

    res.json(concursos);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });

  }

};

exports.obtenerPorId = async (req, res) => {

  try {

    const concurso = await Concurso.buscarPorId(req.params.id);

    if (!concurso) {
      return res.status(404).json({
        message: 'Concurso no encontrado'
      });
    }

    res.json(concurso);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

exports.crear = async (req, res) => {

  try {

    const id = await Concurso.crear(req.body);

    res.status(201).json({
      id,
      message: 'Concurso creado'
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

exports.actualizar = async (req, res) => {

  try {

    await Concurso.actualizar(req.params.id, req.body);

    res.json({
      message: 'Concurso actualizado'
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

exports.eliminar = async (req, res) => {

  try {

    await Concurso.eliminar(req.params.id);

    res.json({
      message: 'Concurso eliminado'
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};