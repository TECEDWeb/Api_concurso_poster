const Concurso = require('../model/concursoModel');
const Rubrica = require('../model/rubricaModel');
const Nivel = require('../model/nivelModel');
const Seccion = require('../model/seccionModel');
const Criterio = require('../model/criterioModel');

class RubricaService {

  static async listar() {
    // Obtener todas las rúbricas
    const rubricas = await Rubrica.getAll();
    const resultado = [];

    for (const rubrica of rubricas) {
      // Obtener secciones de la rúbrica (a través del concurso)
      const secciones = await Seccion.obtenerPorConcurso(rubrica.concurso_id);

      for (const seccion of secciones) {
        const criterios = await Criterio.obtenerPorRubrica(rubrica.id);
        
        for (const criterio of criterios) {
          criterio.niveles = await Nivel.obtenerPorCriterio(criterio.id);
        }
        
        seccion.criterios = criterios;
      }

      // Obtener niveles generales del concurso
      const nivelesGenerales = await Nivel.obtenerPorConcurso(rubrica.concurso_id);

      resultado.push({
        rubricaId: rubrica.id,
        concursoId: rubrica.concurso_id,
        nombre: rubrica.nombre,
        descripcion: rubrica.descripcion,
        puntajeMaximo: rubrica.puntaje_maximo,
        estado: rubrica.estado,
        secciones: secciones,
        niveles: nivelesGenerales
      });
    }

    return resultado;
  }

  static async obtener(concursoId) {
    const rubrica = await Rubrica.getByConcurso(concursoId);
    if (!rubrica) return null;

    const secciones = await Seccion.obtenerPorConcurso(concursoId);

    for (const seccion of secciones) {
      const criterios = await Criterio.obtenerPorRubrica(rubrica.id);
      
      for (const criterio of criterios) {
        criterio.niveles = await Nivel.obtenerPorCriterio(criterio.id);
      }
      
      seccion.criterios = criterios;
    }

    const nivelesGenerales = await Nivel.obtenerPorConcurso(concursoId);

    return {
      rubricaId: rubrica.id,
      concursoId: rubrica.concurso_id,
      nombre: rubrica.nombre,
      descripcion: rubrica.descripcion,
      puntajeMaximo: rubrica.puntaje_maximo,
      estado: rubrica.estado,
      secciones: secciones,
      niveles: nivelesGenerales
    };
  }

  static async crear(data) {
    const { concurso_id, nombre, descripcion, puntaje_maximo } = data;
    
    const rubricaId = await Rubrica.create({
      concurso_id,
      nombre,
      descripcion,
      puntaje_maximo
    });

    return { id: rubricaId };
  }

  static async actualizar(id, data) {
    await Rubrica.update(id, data);
    return { id, ...data };
  }

  static async eliminar(id) {
    await Rubrica.delete(id);
    return true;
  }

  static async exportar(id) {
    const rubrica = await this.obtener(id);
    if (!rubrica) return null;
    return Buffer.from('Rubrica exportada');
  }
}

module.exports = RubricaService;