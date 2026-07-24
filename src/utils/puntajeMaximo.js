const db = require('../config/db');

function num(valor) {
  return Number(valor) || 0;
}

/**
 * Calcula el puntaje máximo REAL de un concurso, sumando por cada
 * criterio el nivel más alto disponible (su propio nivel personalizado
 * si lo tiene, o el nivel global del concurso si no). Este valor NO se
 * guarda en la base de datos como número fijo — se recalcula cada vez
 * que se consulta, así que agregar o quitar criterios/niveles se
 * refleja automáticamente sin desfasar los porcentajes en ningún
 * módulo de la aplicación (Reportes, Asignaciones, etc.).
 */
async function calcularPuntajeMaximoReal(concursoId) {
  if (!concursoId) return 100;

  const [rows] = await db.query(`
    SELECT ROUND(SUM(
      COALESCE(
        (SELECT MAX(n2.puntaje) FROM niveles n2 WHERE n2.criterio_id = cr.id),
        (SELECT MAX(n3.puntaje) FROM niveles n3 WHERE n3.concurso_id = s.concurso_id AND n3.criterio_id IS NULL)
      )
    ), 2) AS puntaje_maximo_real
    FROM criterios cr
    JOIN secciones s ON s.id = cr.seccion_id
    WHERE s.concurso_id = ?
  `, [concursoId]);

  const max = num(rows[0]?.puntaje_maximo_real);
  // Si el concurso todavía no tiene criterios/niveles configurados,
  // se usa 100 como respaldo para no dividir entre 0 en el frontend.
  return max > 0 ? max : 100;
}

/**
 * Versión en lote: evita hacer una consulta por cada concurso cuando
 * se procesan varios proyectos de distintos concursos a la vez.
 */
async function calcularPuntajesMaximosPorConcursos(concursoIds) {
  const idsUnicos = [...new Set(concursoIds.filter(id => id))];
  if (idsUnicos.length === 0) return {};

  const [rows] = await db.query(`
    SELECT 
      s.concurso_id AS concursoId,
      ROUND(SUM(
        COALESCE(
          (SELECT MAX(n2.puntaje) FROM niveles n2 WHERE n2.criterio_id = cr.id),
          (SELECT MAX(n3.puntaje) FROM niveles n3 WHERE n3.concurso_id = s.concurso_id AND n3.criterio_id IS NULL)
        )
      ), 2) AS puntajeMaximoReal
    FROM criterios cr
    JOIN secciones s ON s.id = cr.seccion_id
    WHERE s.concurso_id IN (?)
    GROUP BY s.concurso_id
  `, [idsUnicos]);

  const mapa = {};
  rows.forEach(r => {
    mapa[r.concursoId] = num(r.puntajeMaximoReal) || 100;
  });
  return mapa;
}

module.exports = {
  calcularPuntajeMaximoReal,
  calcularPuntajesMaximosPorConcursos
};