const db = require('../config/db');

const RubricaService = {

  static async listar() {
    try {
      // Obtener todas las rúbricas
      const [rubricas] = await db.query(`
        SELECT * FROM rubricas ORDER BY created_at DESC
      `);

      const resultado = [];

      for (const rubrica of rubricas) {
        // Obtener secciones del concurso
        const [secciones] = await db.query(`
          SELECT * FROM secciones WHERE concurso_id = ? ORDER BY orden ASC
        `, [rubrica.concurso_id]);

        // Obtener niveles del concurso
        const [niveles] = await db.query(`
          SELECT * FROM niveles WHERE concurso_id = ? ORDER BY puntaje ASC
        `, [rubrica.concurso_id]);

        // Obtener criterios para cada sección
        for (const seccion of secciones) {
          const [criterios] = await db.query(`
            SELECT * FROM criterios WHERE seccion_id = ? ORDER BY orden ASC
          `, [seccion.id]);
          seccion.criterios = criterios;
        }

        resultado.push({
          concursoId: rubrica.concurso_id,
          secciones: secciones,
          niveles: niveles
        });
      }

      return resultado;

    } catch (error) {
      console.error('❌ ERROR listar rubricas:', error);
      throw error;
    }
  },

  static async obtener(concursoId) {
    try {
      // Buscar rúbrica por concurso_id
      const [rubricas] = await db.query(`
        SELECT * FROM rubricas WHERE concurso_id = ?
      `, [concursoId]);

      if (rubricas.length === 0) {
        return null;
      }

      const rubrica = rubricas[0];

      // Obtener secciones del concurso
      const [secciones] = await db.query(`
        SELECT * FROM secciones WHERE concurso_id = ? ORDER BY orden ASC
      `, [concursoId]);

      // Obtener niveles del concurso
      const [niveles] = await db.query(`
        SELECT * FROM niveles WHERE concurso_id = ? ORDER BY puntaje ASC
      `, [concursoId]);

      // Obtener criterios para cada sección
      for (const seccion of secciones) {
        const [criterios] = await db.query(`
          SELECT * FROM criterios WHERE seccion_id = ? ORDER BY orden ASC
        `, [seccion.id]);
        seccion.criterios = criterios;
      }

      return {
        concursoId: rubrica.concurso_id,
        secciones: secciones,
        niveles: niveles
      };

    } catch (error) {
      console.error('❌ ERROR obtener rubrica:', error);
      throw error;
    }
  },

  static async crear(data) {
    try {
      const { concurso_id, nombre, descripcion, puntaje_maximo, secciones, niveles } = data;

      // Verificar si ya existe una rúbrica para este concurso
      const [existentes] = await db.query(`
        SELECT * FROM rubricas WHERE concurso_id = ?
      `, [concurso_id]);

      if (existentes.length > 0) {
        throw new Error('Ya existe una rúbrica para este concurso');
      }

      // Crear la rúbrica
      const [result] = await db.query(`
        INSERT INTO rubricas (concurso_id, nombre, descripcion, puntaje_maximo, estado)
        VALUES (?, ?, ?, ?, ?)
      `, [concurso_id, nombre, descripcion || null, puntaje_maximo || 100, 'ACTIVA']);

      // Si hay secciones, crearlas
      if (secciones && secciones.length > 0) {
        for (const seccion of secciones) {
          const [seccionResult] = await db.query(`
            INSERT INTO secciones (concurso_id, nombre, orden, descripcion)
            VALUES (?, ?, ?, ?)
          `, [concurso_id, seccion.nombre, seccion.orden || 0, seccion.descripcion || null]);

          // Si hay criterios en la sección, crearlos
          if (seccion.criterios && seccion.criterios.length > 0) {
            for (const criterio of seccion.criterios) {
              await db.query(`
                INSERT INTO criterios (seccion_id, rubrica_id, texto, orden)
                VALUES (?, ?, ?, ?)
              `, [seccionResult.insertId, result.insertId, criterio.texto, criterio.orden || 0]);
            }
          }
        }
      }

      // Si hay niveles, crearlos
      if (niveles && niveles.length > 0) {
        for (const nivel of niveles) {
          await db.query(`
            INSERT INTO niveles (concurso_id, nombre, puntaje, descripcion)
            VALUES (?, ?, ?, ?)
          `, [concurso_id, nivel.nombre, nivel.puntaje || 0, nivel.descripcion || null]);
        }
      }

      return { id: result.insertId, concurso_id };

    } catch (error) {
      console.error('❌ ERROR crear rubrica:', error);
      throw error;
    }
  },

  static async actualizar(id, data) {
    try {
      const { nombre, descripcion, puntaje_maximo } = data;

      // Buscar la rúbrica por concurso_id
      const [rubricas] = await db.query(`
        SELECT * FROM rubricas WHERE concurso_id = ?
      `, [id]);

      if (rubricas.length === 0) {
        throw new Error('Rúbrica no encontrada');
      }

      const rubrica = rubricas[0];

      // Actualizar la rúbrica
      await db.query(`
        UPDATE rubricas 
        SET nombre = ?, descripcion = ?, puntaje_maximo = ?
        WHERE id = ?
      `, [nombre, descripcion || null, puntaje_maximo || 100, rubrica.id]);

      return { concurso_id: id };

    } catch (error) {
      console.error('❌ ERROR actualizar rubrica:', error);
      throw error;
    }
  },

  static async eliminar(id) {
    try {
      // Buscar la rúbrica por concurso_id
      const [rubricas] = await db.query(`
        SELECT * FROM rubricas WHERE concurso_id = ?
      `, [id]);

      if (rubricas.length === 0) {
        return false;
      }

      const rubrica = rubricas[0];

      // Desactivar restricciones temporalmente
      await db.query('SET FOREIGN_KEY_CHECKS = 0');

      // Eliminar referencias en evaluaciones
      await db.query('DELETE FROM evaluaciones WHERE rubrica_id = ?', [rubrica.id]);

      // Eliminar la rúbrica
      await db.query('DELETE FROM rubricas WHERE id = ?', [rubrica.id]);

      // Reactivar restricciones
      await db.query('SET FOREIGN_KEY_CHECKS = 1');

      return true;

    } catch (error) {
      // Asegurar que se reactivan las restricciones
      await db.query('SET FOREIGN_KEY_CHECKS = 1');
      console.error('❌ ERROR eliminar rubrica:', error);
      throw error;
    }
  },

  static async exportar(id) {
    const rubrica = await this.obtener(id);
    if (!rubrica) return null;
    return Buffer.from('Rúbrica exportada');
  }
};

module.exports = RubricaService;