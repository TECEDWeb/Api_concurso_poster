const Concurso = require('../model/concursoModel');
const Nivel = require('../model/nivelModel');
const Seccion = require('../model/seccionModel');
const Criterio = require('../model/criterioModel');

class RubricaService {

  static async listar() {
    // Usar el método correcto: listar() en lugar de obtenerTodos()
    const concursos = await Concurso.listar();
    const resultado = [];

    for (const concurso of concursos) {
      const niveles = await Nivel.obtenerPorConcurso(concurso.id);
      const secciones = await Seccion.getByConcurso(concurso.id);

      for (const seccion of secciones) {
        seccion.criterios = await Criterio.getBySeccion(seccion.id);
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
    const secciones = await Seccion.getByConcurso(concursoId);

    for (const seccion of secciones) {
      seccion.criterios = await Criterio.getBySeccion(seccion.id);
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
    // Implementar exportación de rúbrica a Excel
    const rubrica = await this.obtener(id);
    if (!rubrica) return null;

    // Aquí iría la lógica para generar el Excel
    return Buffer.from('Rubrica exportada');
  }
}

module.exports = RubricaService;