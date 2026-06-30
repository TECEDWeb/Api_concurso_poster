const Response = {

  success(res, data = null, message = 'OK') {
    return res.status(200).json({
      ok: true,
      message,
      data
    });
  },

  created(res, data = null, message = 'Creado correctamente') {
    return res.status(201).json({
      ok: true,
      message,
      data
    });
  },

  error(res, message = 'Error interno', code = 500) {
    return res.status(code).json({
      ok: false,
      message
    });
  },

  unauthorized(res, message = 'No autorizado') {
    return res.status(401).json({
      ok: false,
      message
    });
  },

  notFound(res, message = 'No encontrado') {
    return res.status(404).json({
      ok: false,
      message
    });
  }
};

module.exports = Response;