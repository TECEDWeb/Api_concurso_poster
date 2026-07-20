const db = require('../config/db');
const ExcelJS = require('exceljs');

const RubricaService = {

  async listar() {
    try {
      console.log('listar: Iniciando...');
      
      const [rubricas] = await db.query(`
        SELECT * FROM rubricas ORDER BY created_at DESC
      `);

      console.log(`listar: ${rubricas.length} rúbricas encontradas`);

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
      console.error('ERROR listar rubricas:', error);
      throw error;
    }
  },

  async obtener(concursoId) {
    try {
      console.log(`obtener: Buscando rúbrica para concurso ${concursoId}`);
      
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
      console.error('ERROR obtener rubrica:', error);
      throw error;
    }
  },

  async crear(data) {
    try {
      console.log('crear: Creando rúbrica');
      console.log('crear: Datos:', JSON.stringify(data, null, 2));

      const { concurso_id, nombre, descripcion, puntaje_maximo } = data;

      const [existentes] = await db.query(`
        SELECT * FROM rubricas WHERE concurso_id = ?
      `, [concurso_id]);

      if (existentes.length > 0) {
        throw new Error('Ya existe una rúbrica para este concurso');
      }

      const [result] = await db.query(`
        INSERT INTO rubricas (concurso_id, nombre, descripcion, puntaje_maximo, estado)
        VALUES (?, ?, ?, ?, ?)
      `, [concurso_id, nombre, descripcion || null, puntaje_maximo || 100, 'ACTIVA']);

      console.log(`Rúbrica creada con ID: ${result.insertId}`);

      return { id: result.insertId, concurso_id };

    } catch (error) {
      console.error('ERROR crear rubrica:', error);
      throw error;
    }
  },

  async actualizar(id, data) {
    try {
      console.log(`actualizar: Actualizando rúbrica para concurso ${id}`);
      console.log('actualizar: Datos:', JSON.stringify(data, null, 2));

      const { nombre, descripcion, puntaje_maximo } = data;

      const [rubricas] = await db.query(`
        SELECT * FROM rubricas WHERE concurso_id = ?
      `, [id]);

      if (rubricas.length === 0) {
        throw new Error('Rúbrica no encontrada');
      }

      const rubrica = rubricas[0];

      await db.query(`
        UPDATE rubricas 
        SET nombre = ?, descripcion = ?, puntaje_maximo = ?
        WHERE id = ?
      `, [nombre, descripcion || null, puntaje_maximo || 100, rubrica.id]);

      console.log(`Rúbrica actualizada para concurso ${id}`);

      return { concurso_id: id };

    } catch (error) {
      console.error('ERROR actualizar rubrica:', error);
      throw error;
    }
  },

  async eliminar(id) {
    try {
      console.log(`eliminar: Eliminando rúbrica para concurso ${id}`);
      
      const [rubricas] = await db.query(`
        SELECT * FROM rubricas WHERE concurso_id = ?
      `, [id]);

      if (rubricas.length === 0) {
        return false;
      }

      const rubrica = rubricas[0];

      await db.query('SET FOREIGN_KEY_CHECKS = 0');
      await db.query('DELETE FROM evaluaciones WHERE rubrica_id = ?', [rubrica.id]);
      await db.query('DELETE FROM rubricas WHERE id = ?', [rubrica.id]);
      await db.query('SET FOREIGN_KEY_CHECKS = 1');

      console.log(`Rúbrica eliminada para concurso ${id}`);
      return true;

    } catch (error) {
      await db.query('SET FOREIGN_KEY_CHECKS = 1');
      console.error('ERROR eliminar rubrica:', error);
      throw error;
    }
  },

  async exportar(id) {
    try {
      console.log(`exportar: Exportando rúbrica para concurso ${id}`);
      
      const rubrica = await this.obtener(id);
      if (!rubrica) {
        throw new Error('Rúbrica no encontrada');
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Evaluación';
      workbook.created = new Date();

      const sheet1 = workbook.addWorksheet('Rúbrica', {
        properties: { tabColor: { argb: 'FF2563EB' } }
      });

      sheet1.mergeCells('A1:D1');
      const titleCell = sheet1.getCell('A1');
      titleCell.value = `RÚBRICA DE EVALUACIÓN - CONCURSO #${id}`;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F2937' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet1.getRow(1).height = 40;

      const headerRow = sheet1.getRow(3);
      headerRow.values = ['SECCIÓN', 'DESCRIPCIÓN', 'CRITERIO', 'NIVELES'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 30;

      sheet1.getColumn(1).width = 20;
      sheet1.getColumn(2).width = 30;
      sheet1.getColumn(3).width = 50;
      sheet1.getColumn(4).width = 30;

      let rowIndex = 4;

      for (const seccion of rubrica.secciones) {
        const seccionNombre = seccion.nombre || 'Sin nombre';
        const seccionDescripcion = seccion.descripcion || '';

        if (seccion.criterios && seccion.criterios.length > 0) {
          for (const criterio of seccion.criterios) {
            const row = sheet1.getRow(rowIndex);
            
            if (rowIndex === 4 || sheet1.getCell(rowIndex - 1, 1).value !== seccionNombre) {
              row.getCell(1).value = seccionNombre;
              row.getCell(2).value = seccionDescripcion;
            }

            row.getCell(3).value = criterio.texto || '';

            const nivelesTexto = (criterio.niveles || [])
              .map(n => `${n.nombre}: ${n.puntaje} pts`)
              .join('\n');
            row.getCell(4).value = nivelesTexto;

            row.alignment = { vertical: 'top', wrapText: true };
            row.getCell(1).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
            row.getCell(3).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
            row.getCell(4).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

            for (let col = 1; col <= 4; col++) {
              const cell = row.getCell(col);
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
              };
            }

            row.height = 50;
            rowIndex++;
          }
        } else {
          const row = sheet1.getRow(rowIndex);
          row.getCell(1).value = seccionNombre;
          row.getCell(2).value = seccionDescripcion;
          row.getCell(3).value = '(Sin criterios)';
          
          row.height = 30;
          rowIndex++;
        }
      }

      const sheet2 = workbook.addWorksheet('Niveles', {
        properties: { tabColor: { argb: 'FF10B981' } }
      });

      sheet2.mergeCells('A1:C1');
      const title2 = sheet2.getCell('A1');
      title2.value = `NIVELES DE DESEMPEÑO - CONCURSO #${id}`;
      title2.font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
      title2.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet2.getRow(1).height = 35;

      const headerRow2 = sheet2.getRow(3);
      headerRow2.values = ['NIVEL', 'PUNTAJE', 'DESCRIPCIÓN'];
      headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      headerRow2.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow2.height = 30;

      sheet2.getColumn(1).width = 20;
      sheet2.getColumn(2).width = 15;
      sheet2.getColumn(3).width = 40;

      let rowIndex2 = 4;
      for (const nivel of rubrica.niveles || []) {
        const row = sheet2.getRow(rowIndex2);
        row.values = [
          nivel.nombre || 'Sin nombre',
          nivel.puntaje || 0,
          nivel.descripcion || ''
        ];
        row.alignment = { vertical: 'middle', wrapText: true };
        
        for (let col = 1; col <= 3; col++) {
          const cell = row.getCell(col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          };
        }
        row.height = 25;
        rowIndex2++;
      }

      const buffer = await workbook.xlsx.writeBuffer();

      console.log(`Rúbrica exportada exitosamente (${buffer.length} bytes)`);
      return buffer;

    } catch (error) {
      console.error('ERROR exportar rubrica:', error);
      throw error;
    }
  }
};

module.exports = RubricaService;