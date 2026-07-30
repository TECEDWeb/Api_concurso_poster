const concursoModel = require('../model/concursoModel');

const concursoService = {

  /**
   * Listar concursos según el rol del usuario
   */
  async listar(usuario) {
    // Si es admin, ve todos
    if (usuario.rol === 'admin') {
      return await concursoModel.listar();
    } 
    // Si es coordinador, ve solo los suyos
    else if (usuario.rol === 'coordinador') {
      return await concursoModel.listarPorCoordinador(usuario.id);
    } 
    // Otros roles no ven nada
    else {
      return [];
    }
  },

  /**
   * Obtener un concurso por ID con validación de permisos
   */
  async obtenerPorId(id, usuario) {
    const concurso = await concursoModel.buscarPorId(id);
    
    if (!concurso) return null;

    // Seguridad: El coordinador solo puede ver su propio concurso
    if (usuario.rol === 'coordinador' && concurso.coordinador_id !== usuario.id) {
      return null; // El controlador interpretará esto como "No autorizado"
    }

    return concurso;
  },

  /**
   * Crear un nuevo concurso
   */
  async crear(data) {
    return await concursoModel.crear(data);
  },

  /**
   * Actualizar un concurso existente
   */
  async actualizar(id, data) {
    return await concursoModel.actualizar(id, data);
  },

  /**
   * Eliminar un concurso
   */
  async eliminar(id) {
    return await concursoModel.eliminar(id);
  }
};

module.exports = concursoService;