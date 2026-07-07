const Concurso = require('../model/concursoModel');
const Nivel = require('../model/nivelModel');
const Seccion = require('../model/seccionModel');
const Criterio = require('../model/criterioModel');

class RubricaService {

  static async listar() {
    const concursos = await Concurso.obtenerTodos();
    const resultado = [];

    for (const concurso of concursos) {
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
    const concurso = await Concurso.obtenerPorId(concursoId);
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
    // Esto dependerá de cómo quieras estructurar la creación
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
    // Implementar exportación de rúbrica a Excel
    const rubrica = await this.obtener(id);
    if (!rubrica) return null;

    // Aquí iría la lógica para generar el Excel
    // Por ahora retornamos un buffer vacío
    return Buffer.from('Rubrica exportada');
  }
}

module.exports = RubricaService;