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
      // Obtener secciones del concurso
      const secciones = await Seccion.getByConcurso(rubrica.concurso_id);

      for (const seccion of secciones) {
        // Obtener criterios de la sección
        const criterios = await Criterio.getBySeccion(seccion.id);
        
        // Obtener niveles para cada criterio
        for (const criterio of criterios) {
          criterio.niveles = await Nivel.getByCriterio(criterio.id);
        }
        
        seccion.criterios = criterios;
      }

      // Obtener niveles generales del concurso
      const nivelesGenerales = await Nivel.getByConcurso(rubrica.concurso_id);

      resultado.push({
        concursoId: rubrica.concurso_id,
        secciones: secciones,
        niveles: nivelesGenerales
      });
    }

    return resultado;
  }

  static async obtener(concursoId) {
    // Buscar rúbrica por concurso_id
    const rubrica = await Rubrica.getByConcurso(concursoId);
    if (!rubrica) return null;

    // Obtener secciones del concurso
    const secciones = await Seccion.getByConcurso(concursoId);

    for (const seccion of secciones) {
      const criterios = await Criterio.getBySeccion(seccion.id);
      
      for (const criterio of criterios) {
        criterio.niveles = await Nivel.getByCriterio(criterio.id);
      }
      
      seccion.criterios = criterios;
    }

    const nivelesGenerales = await Nivel.getByConcurso(concursoId);

    return {
      concursoId: rubrica.concurso_id,
      secciones: secciones,
      niveles: nivelesGenerales
    };
  }

  static async crear(data) {
    const { concursoId, nombre, descripcion, puntajeMaximo } = data;
    
    // Verificar si ya existe una rúbrica para este concurso
    const existente = await Rubrica.getByConcurso(concursoId);
    if (existente) {
      throw new Error('Ya existe una rúbrica para este concurso');
    }

    const rubricaId = await Rubrica.create({
      concurso_id: concursoId,
      nombre: nombre || `Rúbrica del concurso #${concursoId}`,
      descripcion: descripcion || null,
      puntaje_maximo: puntajeMaximo || 100
    });

    return { id: rubricaId, concursoId };
  }

  static async actualizar(id, data) {
    // id es el concursoId
    const rubrica = await Rubrica.getByConcurso(id);
    if (!rubrica) {
      throw new Error('Rúbrica no encontrada');
    }

    await Rubrica.update(rubrica.id, {
      nombre: data.nombre || rubrica.nombre,
      descripcion: data.descripcion || rubrica.descripcion,
      puntaje_maximo: data.puntajeMaximo || rubrica.puntaje_maximo
    });

    return { concursoId: id };
  }

  static async eliminar(id) {
    // id es el concursoId
    const rubrica = await Rubrica.getByConcurso(id);
    if (!rubrica) {
      return false;
    }

    // Eliminar la rúbrica (ON DELETE CASCADE eliminará criterios asociados)
    await Rubrica.delete(rubrica.id);
    return true;
  }

  static async exportar(id) {
    const rubrica = await this.obtener(id);
    if (!rubrica) return null;
    
    // TODO: Implementar exportación a Excel
    return Buffer.from('Rúbrica exportada');
  }
}

module.exports = RubricaService;