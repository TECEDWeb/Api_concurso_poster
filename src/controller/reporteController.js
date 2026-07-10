const db = require('../config/db');
const ExcelJS = require('exceljs');
const PdfPrinter = require('pdfmake');

// =====================================
// STATS GENERALES
// =====================================
exports.stats = async (req, res) => {
  try {
    const [[proyectos]] = await db.query('SELECT COUNT(*) AS total FROM proyectos');
    const [[evaluaciones]] = await db.query('SELECT COUNT(*) AS total FROM evaluaciones');
    const [[completadas]] = await db.query("SELECT COUNT(*) AS total FROM evaluaciones WHERE estado = 'evaluado'");
    
    // Calcular promedio
    let promedio = 0;
    try {
      const [promedioResult] = await db.query(`
        SELECT AVG(total_puntaje) AS promedio FROM (
          SELECT SUM(n.puntaje) AS total_puntaje
          FROM evaluaciones e
          JOIN detalles_evaluacion d ON e.id = d.evaluacion_id
          JOIN niveles n ON d.nivel_id = n.id
          GROUP BY e.id
        ) AS puntajes
      `);
      promedio = promedioResult[0].promedio || 0;
    } catch (e) {
      promedio = 0;
    }

    return res.json({
      ok: true,
      data: {
        proyectos: proyectos.total || 0,
        evaluaciones: evaluaciones.total || 0,
        completadas: completadas.total || 0,
        promedio: Math.round(promedio * 10) / 10
      }
    });

  } catch (error) {
    console.error('ERROR STATS:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error obteniendo estadísticas'
    });
  }
};

// =====================================
// RANKING GENERAL
// =====================================
exports.ranking = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.nombre AS proyecto,
        ROUND(SUM(n.puntaje), 2) AS puntaje_total,
        ROUND(AVG(n.puntaje), 2) AS promedio
      FROM evaluaciones e
      INNER JOIN proyectos p ON p.id = e.proyecto_id
      INNER JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      INNER JOIN niveles n ON n.id = d.nivel_id
      GROUP BY p.id, p.nombre
      ORDER BY promedio DESC
    `);

    return res.json({
      ok: true,
      data: rows
    });

  } catch (error) {
    console.error('ERROR RANKING:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error generando ranking'
    });
  }
};

// =====================================
// REPORTES POR PROYECTO
// =====================================
exports.proyectos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.nombre AS proyecto,
        COUNT(DISTINCT e.id) AS evaluaciones,
        ROUND(AVG(n.puntaje), 2) AS promedio,
        u.nombre AS evaluador,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntaje
      FROM proyectos p
      LEFT JOIN evaluaciones e ON e.proyecto_id = p.id
      LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      LEFT JOIN niveles n ON n.id = d.nivel_id
      LEFT JOIN usuarios u ON u.id = e.evaluador_id
      GROUP BY p.id, p.nombre, u.id, u.nombre, u.rol
      ORDER BY p.nombre ASC
    `);

    const proyectos = [];
    rows.forEach(row => {
      let proyecto = proyectos.find(item => item.proyecto === row.proyecto);
      if (!proyecto) {
        proyecto = {
          id: row.id,
          proyecto: row.proyecto,
          evaluaciones: row.evaluaciones,
          promedio: row.promedio,
          evaluadores: []
        };
        proyectos.push(proyecto);
      }
      if (row.evaluador) {
        proyecto.evaluadores.push({
          nombre: row.evaluador,
          rol: row.rol,
          puntaje: row.puntaje
        });
      }
    });

    return res.json({
      ok: true,
      data: proyectos
    });

  } catch (error) {
    console.error('ERROR REPORTES PROYECTOS:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error obteniendo reportes'
    });
  }
};

// =====================================
// EXPORTAR REPORTE EXCEL GENERAL
// =====================================
exports.exportar = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.nombre AS proyecto,
        u.nombre AS evaluador,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntaje,
        ROUND(AVG(n.puntaje), 2) AS promedio
      FROM proyectos p
      LEFT JOIN evaluaciones e ON e.proyecto_id = p.id
      LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      LEFT JOIN niveles n ON n.id = d.nivel_id
      LEFT JOIN usuarios u ON u.id = e.evaluador_id
      GROUP BY p.nombre, u.nombre, u.rol
      ORDER BY p.nombre ASC
    `);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte Evaluaciones');

    sheet.columns = [
      { header: 'Proyecto', key: 'proyecto', width: 35 },
      { header: 'Evaluador', key: 'evaluador', width: 30 },
      { header: 'Rol', key: 'rol', width: 20 },
      { header: 'Puntaje', key: 'puntaje', width: 15 },
      { header: 'Promedio', key: 'promedio', width: 15 }
    ];

    rows.forEach(row => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-evaluaciones.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('ERROR EXPORTAR EXCEL:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error generando Excel'
    });
  }
};

// =====================================
// EXPORTAR REPORTE EXCEL POR PROYECTO
// =====================================
exports.exportarProyecto = async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.proyectoId);
    console.log(`📤 Exportando Excel para proyecto ID: ${proyectoId}`);

    const [proyectos] = await db.query(
      `SELECT id, nombre FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Proyecto no encontrado'
      });
    }

    const proyecto = proyectos[0];

    const [rows] = await db.query(`
      SELECT
        u.nombre AS evaluador,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntaje,
        ROUND(AVG(n.puntaje), 2) AS promedio
      FROM evaluaciones e
      JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      JOIN niveles n ON n.id = d.nivel_id
      JOIN usuarios u ON u.id = e.evaluador_id
      WHERE e.proyecto_id = ?
      GROUP BY u.id, u.nombre, u.rol
      ORDER BY puntaje DESC
    `, [proyectoId]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Reporte ${proyecto.nombre}`);

    // Título
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `REPORTE DE EVALUACIÓN - ${proyecto.nombre.toUpperCase()}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF003366' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    // Encabezados
    const headerRow = sheet.getRow(3);
    headerRow.values = ['Evaluador', 'Rol', 'Puntaje', 'Promedio'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;

    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;

    let rowIndex = 4;
    rows.forEach(row => {
      const rowData = sheet.getRow(rowIndex);
      rowData.values = [row.evaluador, row.rol, row.puntaje || 0, row.promedio || 0];
      rowData.alignment = { vertical: 'middle' };
      rowData.height = 25;
      rowIndex++;
    });

    if (rows.length > 0) {
      const totalRow = sheet.getRow(rowIndex);
      totalRow.values = ['TOTAL', '', 
        rows.reduce((sum, r) => sum + (r.puntaje || 0), 0).toFixed(2),
        (rows.reduce((sum, r) => sum + (r.promedio || 0), 0) / rows.length).toFixed(2)
      ];
      totalRow.font = { bold: true };
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
      totalRow.height = 25;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${proyecto.nombre}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('ERROR EXPORTAR PROYECTO EXCEL:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error generando Excel del proyecto'
    });
  }
};

// =====================================
// DETALLE DE PROYECTO
// =====================================
exports.detalleProyecto = async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.proyectoId);
    console.log(`📋 Obteniendo detalle del proyecto ID: ${proyectoId}`);

    const [proyectos] = await db.query(
      `SELECT id, nombre, descripcion FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Proyecto no encontrado'
      });
    }

    const proyecto = proyectos[0];

    const [evaluaciones] = await db.query(`
      SELECT 
        e.id,
        u.nombre AS evaluador,
        u.rol,
        e.estado,
        e.fecha_evaluacion,
        e.observaciones,
        ROUND(SUM(n.puntaje), 2) AS puntaje_total
      FROM evaluaciones e
      JOIN usuarios u ON u.id = e.evaluador_id
      LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      LEFT JOIN niveles n ON n.id = d.nivel_id
      WHERE e.proyecto_id = ?
      GROUP BY e.id, u.nombre, u.rol, e.estado, e.fecha_evaluacion, e.observaciones
      ORDER BY e.fecha_evaluacion DESC
    `, [proyectoId]);

    const [evaluadores] = await db.query(`
      SELECT 
        u.nombre,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntaje,
        ROUND(AVG(n.puntaje), 2) AS promedio
      FROM evaluaciones e
      JOIN usuarios u ON u.id = e.evaluador_id
      LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      LEFT JOIN niveles n ON n.id = d.nivel_id
      WHERE e.proyecto_id = ?
      GROUP BY u.id, u.nombre, u.rol
      ORDER BY puntaje DESC
    `, [proyectoId]);

    const [promedioResult] = await db.query(`
      SELECT ROUND(AVG(total_puntaje), 2) AS promedio FROM (
        SELECT SUM(n.puntaje) AS total_puntaje
        FROM evaluaciones e
        JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
        JOIN niveles n ON n.id = d.nivel_id
        WHERE e.proyecto_id = ?
        GROUP BY e.id
      ) AS puntajes
    `, [proyectoId]);

    return res.json({
      ok: true,
      data: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion || '',
        evaluaciones: evaluaciones,
        evaluadores: evaluadores,
        promedio: promedioResult[0]?.promedio || 0,
        totalEvaluaciones: evaluaciones.length
      }
    });

  } catch (error) {
    console.error('ERROR DETALLE PROYECTO:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error obteniendo detalle del proyecto'
    });
  }
};

// =====================================
// EXPORTAR PDF GENERAL
// =====================================
exports.exportarPDF = async (req, res) => {
  try {
    console.log('📤 Exportando PDF general de reportes');

    const [rows] = await db.query(`
      SELECT
        p.nombre AS proyecto,
        u.nombre AS evaluador,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntaje,
        ROUND(AVG(n.puntaje), 2) AS promedio
      FROM proyectos p
      LEFT JOIN evaluaciones e ON e.proyecto_id = p.id
      LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      LEFT JOIN niveles n ON n.id = d.nivel_id
      LEFT JOIN usuarios u ON u.id = e.evaluador_id
      GROUP BY p.nombre, u.nombre, u.rol
      ORDER BY p.nombre ASC
    `);

    const totalProyectos = rows.length;
    const totalEvaluadores = [...new Set(rows.map(r => r.evaluador))].length;
    const promedioGeneral = rows.reduce((sum, r) => sum + (r.promedio || 0), 0) / (rows.length || 1);

    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    const printer = new PdfPrinter(fonts);

    const styles = {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        color: '#003366',
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 12,
        bold: true,
        alignment: 'center',
        color: '#64748b',
        margin: [0, 0, 0, 20]
      },
      tableHeader: {
        fontSize: 11,
        bold: true,
        fillColor: '#003366',
        color: 'white',
        alignment: 'center'
      },
      tableCell: {
        fontSize: 10,
        alignment: 'center'
      },
      stats: {
        fontSize: 11,
        margin: [0, 0, 0, 5]
      },
      footer: {
        fontSize: 9,
        alignment: 'center',
        color: '#94a3b8',
        margin: [0, 20, 0, 0]
      }
    };

    const content = [];

    content.push({ text: 'REPORTE DE EVALUACIONES', style: 'header' });
    content.push({ text: `Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, style: 'subheader' });

    content.push({
      text: [
        { text: '📊 Resumen General\n\n', style: 'stats', bold: true },
        { text: `Total de proyectos: ${totalProyectos}\n`, style: 'stats' },
        { text: `Total de evaluadores: ${totalEvaluadores}\n`, style: 'stats' },
        { text: `Promedio general: ${promedioGeneral.toFixed(2)} pts`, style: 'stats' }
      ]
    });

    content.push({ text: '\n' });

    if (rows.length > 0) {
      const tableBody = [
        [
          { text: 'Proyecto', style: 'tableHeader' },
          { text: 'Evaluador', style: 'tableHeader' },
          { text: 'Rol', style: 'tableHeader' },
          { text: 'Puntaje', style: 'tableHeader' },
          { text: 'Promedio', style: 'tableHeader' }
        ]
      ];

      rows.forEach(row => {
        tableBody.push([
          { text: row.proyecto || 'N/A', style: 'tableCell' },
          { text: row.evaluador || 'N/A', style: 'tableCell' },
          { text: row.rol || 'N/A', style: 'tableCell' },
          { text: row.puntaje ? row.puntaje.toFixed(2) : '0.00', style: 'tableCell' },
          { text: row.promedio ? row.promedio.toFixed(2) : '0.00', style: 'tableCell' }
        ]);
      });

      content.push({
        table: {
          headerRows: 1,
          widths: ['*', '*', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        layout: {
          fillColor: function(rowIndex) {
            return rowIndex % 2 === 0 ? '#f8fafc' : null;
          },
          hLineColor: function() { return '#e2e8f0'; },
          vLineColor: function() { return '#e2e8f0'; },
          paddingLeft: function() { return 8; },
          paddingRight: function() { return 8; },
          paddingTop: function() { return 6; },
          paddingBottom: function() { return 6; }
        }
      });
    }

    content.push({
      text: 'Sistema de Evaluación de Proyectos - Powered by UPSE',
      style: 'footer'
    });

    const docDefinition = {
      content: content,
      styles: styles,
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-evaluaciones-${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdfBuffer);
    });
    pdfDoc.end();

  } catch (error) {
    console.error('ERROR EXPORTAR PDF:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error generando PDF: ' + error.message
    });
  }
};

// =====================================
// EXPORTAR PDF POR PROYECTO
// =====================================
exports.exportarPDFProyecto = async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.proyectoId);
    console.log(`📤 Exportando PDF para proyecto ID: ${proyectoId}`);

    const [proyectos] = await db.query(
      `SELECT id, nombre, descripcion FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Proyecto no encontrado'
      });
    }

    const proyecto = proyectos[0];

    const [rows] = await db.query(`
      SELECT
        u.nombre AS evaluador,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntaje,
        ROUND(AVG(n.puntaje), 2) AS promedio
      FROM evaluaciones e
      JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      JOIN niveles n ON n.id = d.nivel_id
      JOIN usuarios u ON u.id = e.evaluador_id
      WHERE e.proyecto_id = ?
      GROUP BY u.id, u.nombre, u.rol
      ORDER BY puntaje DESC
    `, [proyectoId]);

    const totalEvaluadores = rows.length;
    const promedioGeneral = rows.reduce((sum, r) => sum + (r.promedio || 0), 0) / (rows.length || 1);
    const puntajeTotal = rows.reduce((sum, r) => sum + (r.puntaje || 0), 0);

    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    const printer = new PdfPrinter(fonts);

    const styles = {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        color: '#003366',
        margin: [0, 0, 0, 5]
      },
      subheader: {
        fontSize: 12,
        alignment: 'center',
        color: '#64748b',
        margin: [0, 0, 0, 20]
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
        color: '#003366',
        margin: [0, 15, 0, 8]
      },
      tableHeader: {
        fontSize: 11,
        bold: true,
        fillColor: '#003366',
        color: 'white',
        alignment: 'center'
      },
      tableCell: {
        fontSize: 10,
        alignment: 'center'
      },
      stats: {
        fontSize: 11,
        margin: [0, 0, 0, 3]
      },
      footer: {
        fontSize: 9,
        alignment: 'center',
        color: '#94a3b8',
        margin: [0, 20, 0, 0]
      }
    };

    const content = [];

    content.push({ text: `REPORTE DE EVALUACIÓN`, style: 'header' });
    content.push({ text: `Proyecto: ${proyecto.nombre.toUpperCase()}`, style: 'subheader' });
    content.push({ text: `Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, style: 'subheader' });

    if (proyecto.descripcion) {
      content.push({ text: `📝 Descripción: ${proyecto.descripcion}`, style: 'stats' });
    }

    content.push({ text: '\n' });

    content.push({
      text: [
        { text: '📊 Estadísticas del Proyecto\n\n', style: 'sectionTitle' },
        { text: `Total de evaluadores: ${totalEvaluadores}\n`, style: 'stats' },
        { text: `Puntaje total: ${puntajeTotal.toFixed(2)} pts\n`, style: 'stats' },
        { text: `Promedio general: ${promedioGeneral.toFixed(2)} pts`, style: 'stats' }
      ]
    });

    content.push({ text: '\n' });

    if (rows.length > 0) {
      content.push({ text: '📋 Evaluadores', style: 'sectionTitle' });

      const tableBody = [
        [
          { text: 'Evaluador', style: 'tableHeader' },
          { text: 'Rol', style: 'tableHeader' },
          { text: 'Puntaje', style: 'tableHeader' },
          { text: 'Promedio', style: 'tableHeader' }
        ]
      ];

      rows.forEach(row => {
        tableBody.push([
          { text: row.evaluador || 'N/A', style: 'tableCell' },
          { text: row.rol || 'N/A', style: 'tableCell' },
          { text: row.puntaje ? row.puntaje.toFixed(2) : '0.00', style: 'tableCell' },
          { text: row.promedio ? row.promedio.toFixed(2) : '0.00', style: 'tableCell' }
        ]);
      });

      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        layout: {
          fillColor: function(rowIndex) {
            return rowIndex % 2 === 0 ? '#f8fafc' : null;
          },
          hLineColor: function() { return '#e2e8f0'; },
          vLineColor: function() { return '#e2e8f0'; },
          paddingLeft: function() { return 8; },
          paddingRight: function() { return 8; },
          paddingTop: function() { return 6; },
          paddingBottom: function() { return 6; }
        }
      });
    }

    content.push({
      text: 'Sistema de Evaluación de Proyectos - Powered by UPSE',
      style: 'footer'
    });

    const docDefinition = {
      content: content,
      styles: styles,
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-${proyecto.nombre}-${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdfBuffer);
    });
    pdfDoc.end();

  } catch (error) {
    console.error('ERROR EXPORTAR PDF PROYECTO:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error generando PDF del proyecto: ' + error.message
    });
  }
};