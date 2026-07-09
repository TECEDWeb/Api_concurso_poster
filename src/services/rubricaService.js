const db = require('../config/db');

// =========================
// LISTAR RÚBRICAS
// =========================
exports.listar = async function() {
  try {
    console.log('📋 listar: Iniciando...');
    
    // Obtener todas las rúbricas
    const [rubricas] = await db.query(`
      SELECT * FROM rubricas ORDER BY created_at DESC
    `);

    console.log(`📋 listar: ${rubricas.length} rúbricas encontradas`);

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

    console.log(`📋 listar: ${resultado.length} resultados procesados`);
    return resultado;

  } catch (error) {
    console.error('❌ ERROR listar rubricas:', error);
    throw error;
  }
};

// =========================
// OBTENER RÚBRICA POR CONCURSO
// =========================
exports.obtener = async function(concursoId) {
  try {
    console.log(`🔍 obtener: Buscando rúbrica para concurso ${concursoId}`);
    
    // Buscar rúbrica por concurso_id
    const [rubricas] = await db.query(`
      SELECT * FROM rubricas WHERE concurso_id = ?
    `, [concursoId]);

    if (rubricas.length === 0) {
      console.log(`🔍 obtener: No se encontró rúbrica para concurso ${concursoId}`);
      return null;
    }

    const rubrica = rubricas[0];
    console.log(`🔍 obtener: Rúbrica encontrada ID ${rubrica.id}`);

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
};

// =========================
// CREAR RÚBRICA - CON LOGS
// =========================
exports.crear = async function(data) {
  try {
    console.log('📝 crear: Iniciando creación de rúbrica');
    console.log('📝 crear: Datos recibidos:', JSON.stringify(data, null, 2));

    const { concurso_id, nombre, descripcion, puntaje_maximo, secciones, niveles } = data;

    // Validar que lleguen los datos necesarios
    if (!concurso_id) {
      throw new Error('concurso_id es obligatorio');
    }
    if (!nombre || nombre.trim() === '') {
      throw new Error('nombre es obligatorio');
    }

    console.log(`📝 crear: Verificando existencia para concurso ${concurso_id}`);

    // Verificar si ya existe una rúbrica para este concurso
    const [existentes] = await db.query(`
      SELECT * FROM rubricas WHERE concurso_id = ?
    `, [concurso_id]);

    if (existentes.length > 0) {
      console.log(`❌ Ya existe una rúbrica para el concurso ${concurso_id}`);
      throw new Error('Ya existe una rúbrica para este concurso');
    }

    console.log(`📝 crear: Insertando rúbrica para concurso ${concurso_id}`);

    // Crear la rúbrica
    const [result] = await db.query(`
      INSERT INTO rubricas (concurso_id, nombre, descripcion, puntaje_maximo, estado)
      VALUES (?, ?, ?, ?, ?)
    `, [concurso_id, nombre, descripcion || null, puntaje_maximo || 100, 'ACTIVA']);

    console.log(`📝 crear: Rúbrica creada con ID ${result.insertId}`);

    // Si hay secciones, crearlas
    if (secciones && secciones.length > 0) {
      console.log(`📝 crear: Creando ${secciones.length} secciones`);
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
      console.log(`📝 crear: Creando ${niveles.length} niveles`);
      for (const nivel of niveles) {
        await db.query(`
          INSERT INTO niveles (concurso_id, nombre, puntaje, descripcion)
          VALUES (?, ?, ?, ?)
        `, [concurso_id, nivel.nombre, nivel.puntaje || 0, nivel.descripcion || null]);
      }
    }

    console.log(`✅ Rúbrica creada exitosamente para concurso ${concurso_id}`);
    return { id: result.insertId, concurso_id };

  } catch (error) {
    console.error('❌ ERROR crear rubrica:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
};

// =========================
// ACTUALIZAR RÚBRICA
// =========================
exports.actualizar = async function(id, data) {
  try {
    console.log(`📝 actualizar: Actualizando rúbrica para concurso ${id}`);
    console.log('📝 actualizar: Datos:', JSON.stringify(data, null, 2));

    const { nombre, descripcion, puntaje_maximo } = data;

    // Buscar la rúbrica por concurso_id
    const [rubricas] = await db.query(`
      SELECT * FROM rubricas WHERE concurso_id = ?
    `, [id]);

    if (rubricas.length === 0) {
      console.log(`❌ No se encontró rúbrica para concurso ${id}`);
      throw new Error('Rúbrica no encontrada');
    }

    const rubrica = rubricas[0];
    console.log(`📝 actualizar: Rúbrica encontrada ID ${rubrica.id}`);

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
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
};

// =========================
// ELIMINAR RÚBRICA
// =========================
exports.eliminar = async function(id) {
  try {
    console.log(`🗑️ eliminar: Eliminando rúbrica para concurso ${id}`);
    
    // Buscar la rúbrica por concurso_id
    const [rubricas] = await db.query(`
      SELECT * FROM rubricas WHERE concurso_id = ?
    `, [id]);

    if (rubricas.length === 0) {
      console.log(`❌ No se encontró rúbrica para concurso ${id}`);
      return false;
    }

    const rubrica = rubricas[0];
    console.log(`🗑️ eliminar: Rúbrica encontrada ID ${rubrica.id}`);

    // Desactivar restricciones temporalmente
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // Eliminar referencias en evaluaciones
    await db.query('DELETE FROM evaluaciones WHERE rubrica_id = ?', [rubrica.id]);

    // Eliminar la rúbrica
    await db.query('DELETE FROM rubricas WHERE id = ?', [rubrica.id]);

    // Reactivar restricciones
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`✅ Rúbrica eliminada para concurso ${id}`);
    return true;

  } catch (error) {
    // Asegurar que se reactivan las restricciones
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('❌ ERROR eliminar rubrica:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
};

// =========================
// EXPORTAR RÚBRICA
// =========================
exports.exportar = async function(id) {
  try {
    console.log(`📤 exportar: Exportando rúbrica para concurso ${id}`);
    const rubrica = await exports.obtener(id);
    if (!rubrica) {
      console.log(`❌ No se encontró rúbrica para concurso ${id}`);
      return null;
    }
    console.log(`✅ Rúbrica exportada para concurso ${id}`);
    return Buffer.from('Rúbrica exportada');
  } catch (error) {
    console.error('❌ ERROR exportar rubrica:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
};