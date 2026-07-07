const Concurso = require('../model/concursoModel');
const Nivel = require('../model/nivelModel');
const Seccion = require('../model/seccionModel');
const Criterio = require('../model/criterioModel');

class RubricaService {

  static async listar() {
    // Usar el método listar()
    const concursos = await Concurso.listar();
    const resultado = [];

    for (const concurso of concursos) {
      // Usar obtenerPorConcurso (que ahora existe como alias)
      const niveles = await Nivel.obtenerPorConcurso(concurso.id);
      const secciones = await Seccion.obtenerPorConcurso(concurso.id);

      for (const seccion of secciones) {
        seccion.criterios = await Criterio.obtenerPorSeccion(seccion.id);
      }

      resultado.push({
        concursoId: concurso.id,
        secciones,
        niveles
      });
    }

    return resultado;
  }

  static async obtener(concursoId) {
    const concurso = await Concurso.buscarPorId(concursoId);
    if (!concurso) return null;

    const niveles = await Nivel.obtenerPorConcurso(concursoId);
    const secciones = await Seccion.obtenerPorConcurso(concursoId);

    for (const seccion of secciones) {
      seccion.criterios = await Criterio.obtenerPorSeccion(seccion.id);
    }

    return {
      concursoId,
      secciones,
      niveles
    };
  }

  static async crear(data) {
    // Implementar creación de rúbrica
    return data;
  }

  static async actualizar(id, data) {
    // Implementar actualización de rúbrica
    return data;
  }

  static async eliminar(id) {
    // Implementar eliminación de rúbrica
    return true;
  }

  static async exportar(id) {
    const rubrica = await this.obtener(id);
    if (!rubrica) return null;
    return Buffer.from('Rubrica exportada');
  }
}

module.exports = RubricaService;