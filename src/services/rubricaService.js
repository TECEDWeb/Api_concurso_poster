const db = require('../config/db');

const RubricaService = {

  // =========================
  // LISTAR RÚBRICAS
  // =========================
  async listar() {
    try {
      console.log('📋 listar: Iniciando...');
      
      const [rubricas] = await db.query(`
        SELECT * FROM rubricas ORDER BY created_at DESC
      `);

      console.log(`📋 listar: ${rubricas.length} rúbricas encontradas`);

      const resultado = [];

      for (const rubrica of rubricas) {
        const [secciones] = await db.query(`
          SELECT * FROM secciones WHERE concurso_id = ? ORDER BY orden ASC
        `, [rubrica.concurso_id]);

        const [niveles] = await db.query(`
          SELECT * FROM niveles WHERE concurso_id = ? ORDER BY puntaje ASC
        `, [rubrica.concurso_id]);

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

  // =========================
  // OBTENER RÚBRICA POR CONCURSO
  // =========================
  async obtener(concursoId) {
    try {
      console.log(`🔍 obtener: Buscando rúbrica para concurso ${concursoId}`);
      
      const [rubricas] = await db.query(`
        SELECT * FROM rubricas WHERE concurso_id = ?
      `, [concursoId]);

      if (rubricas.length === 0) {
        return null;
      }

      const rubrica = rubricas[0];

      const [secciones] = await db.query(`
        SELECT * FROM secciones WHERE concurso_id = ? ORDER BY orden ASC
      `, [concursoId]);

      const [niveles] = await db.query(`
        SELECT * FROM niveles WHERE concurso_id = ? ORDER BY puntaje ASC
      `, [concursoId]);

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

  // =========================
  // CREAR RÚBRICA
  // =========================
  async crear(data) {
    try {
      console.log('📝 crear: Creando rúbrica');
      console.log('📝 crear: Datos:', JSON.stringify(data, null, 2));

      const { concurso_id, nombre, descripcion, puntaje_maximo, secciones, niveles } = data;

      // Verificar si ya existe
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

      console.log(`✅ Rúbrica creada con ID: ${result.insertId}`);

      return { id: result.insertId, concurso_id };

    } catch (error) {
      console.error('❌ ERROR crear rubrica:', error);
      throw error;
    }
  },

  // =========================
  // ACTUALIZAR RÚBRICA - CORREGIDO
  // =========================
  async actualizar(id, data) {
    try {
      console.log(`📝 actualizar: Actualizando rúbrica para concurso ${id}`);
      console.log('📝 actualizar: Datos:', JSON.stringify(data, null, 2));

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

      console.log(`✅ Rúbrica actualizada para concurso ${id}`);

      return { concurso_id: id };

    } catch (error) {
      console.error('❌ ERROR actualizar rubrica:', error);
      throw error;
    }
  },

  // =========================
  // ELIMINAR RÚBRICA
  // =========================
  async eliminar(id) {
    try {
      console.log(`🗑️ eliminar: Eliminando rúbrica para concurso ${id}`);
      
      const [rubricas] = await db.query(`
        SELECT * FROM rubricas WHERE concurso_id = ?
      `, [id]);

      if (rubricas.length === 0) {
        return false;
      }

      const rubrica = rubricas[0];

      // Desactivar restricciones temporalmente
      await db.query('SET FOREIGN_KEY_CHECKS = 0');

      // Eliminar referencias
      await db.query('DELETE FROM evaluaciones WHERE rubrica_id = ?', [rubrica.id]);
      await db.query('DELETE FROM rubricas WHERE id = ?', [rubrica.id]);

      // Reactivar restricciones
      await db.query('SET FOREIGN_KEY_CHECKS = 1');

      console.log(`✅ Rúbrica eliminada para concurso ${id}`);
      return true;

    } catch (error) {
      await db.query('SET FOREIGN_KEY_CHECKS = 1');
      console.error('❌ ERROR eliminar rubrica:', error);
      throw error;
    }
  },

  // EXPORTAR RÚBRICA
  async exportar(id) {
    try {
      console.log(`📤 exportar: Exportando rúbrica para concurso ${id}`);
      
      // Obtener la rúbrica completa
      const rubrica = await this.obtener(id);
      if (!rubrica) {
        throw new Error('Rúbrica no encontrada');
      }
      
      // Crear un Excel simple (sin librerías externas)
      // Esto es un ejemplo básico, idealmente usarías exceljs
      const excelData = {
        concursoId: rubrica.concursoId,
        secciones: rubrica.secciones.map(s => ({
          nombre: s.nombre,
          descripcion: s.descripcion,
          criterios: s.criterios.map(c => c.texto)
        })),
        niveles: rubrica.niveles.map(n => ({
          nombre: n.nombre,
          puntaje: n.puntaje,
          descripcion: n.descripcion
        }))
      };
      
      // Convertir a CSV o JSON según necesites
      const jsonString = JSON.stringify(excelData, null, 2);
      
      // Devolver como buffer
      return Buffer.from(jsonString, 'utf-8');
      
    } catch (error) {
      console.error('❌ ERROR exportar rubrica:', error);
      throw error;
    }
  }
};

module.exports = RubricaService;