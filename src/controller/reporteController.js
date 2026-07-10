const db = require('../config/db');
const ExcelJS = require('exceljs');

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
// EXPORTAR REPORTE EXCEL POR PROYECTO (NUEVO)
// =====================================
exports.exportarProyecto = async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.proyectoId);
    console.log(`📤 Exportando Excel para proyecto ID: ${proyectoId}`);

    // Obtener datos del proyecto
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

    // Fila de totales
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
// DETALLE DE PROYECTO (NUEVO)
// =====================================
exports.detalleProyecto = async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.proyectoId);
    console.log(`📋 Obteniendo detalle del proyecto ID: ${proyectoId}`);

    // Obtener proyecto
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

    // Obtener evaluaciones del proyecto
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

    // Obtener evaluadores con puntajes
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

    // Calcular promedio general
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