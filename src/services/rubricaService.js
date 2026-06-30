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

                seccion.criterios =
                    await Criterio.obtenerPorSeccion(seccion.id);

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

        if (!concurso)
            return null;

        const niveles =
            await Nivel.obtenerPorConcurso(concursoId);

        const secciones =
            await Seccion.obtenerPorConcurso(concursoId);

        for (const seccion of secciones) {

            seccion.criterios =
                await Criterio.obtenerPorSeccion(seccion.id);

        }

        return {

            concursoId,

            secciones,

            niveles

        };

    }

}

module.exports = RubricaService;