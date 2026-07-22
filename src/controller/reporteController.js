const db = require('../config/db');
const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

// Helper: fuerza a número cualquier valor que MySQL pueda devolver como string
function num(valor) {
  return Number(valor) || 0;
}

// Helper: limpia un nombre de proyecto para usarlo de forma segura
// en un header HTTP (Content-Disposition).
function nombreSeguro(nombre) {
  return (nombre || 'proyecto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ============================================
// HELPER: participantes y tutores
// ============================================
async function obtenerPersonasPorProyectos(proyectoIds) {
  if (!proyectoIds || proyectoIds.length === 0) {
    return { participantesPorProyecto: {}, tutoresPorProyecto: {} };
  }

  const [participantesRows] = await db.query(
    `SELECT proyecto_id, id, nombre, cedula, email
     FROM participantes
     WHERE proyecto_id IN (?)`,
    [proyectoIds]
  );

  const [tutoresRows] = await db.query(
    `SELECT proyecto_id, id, nombre, encargado, cedula, email
     FROM tutores
     WHERE proyecto_id IN (?)`,
    [proyectoIds]
  );

  const participantesPorProyecto = {};
  participantesRows.forEach(p => {
    if (!participantesPorProyecto[p.proyecto_id]) {
      participantesPorProyecto[p.proyecto_id] = [];
    }
    participantesPorProyecto[p.proyecto_id].push({
      id: p.id,
      nombre: p.nombre,
      cedula: p.cedula || null,
      email: p.email || null
    });
  });

  const tutoresPorProyecto = {};
  tutoresRows.forEach(t => {
    if (!tutoresPorProyecto[t.proyecto_id]) {
      tutoresPorProyecto[t.proyecto_id] = [];
    }
    tutoresPorProyecto[t.proyecto_id].push({
      id: t.id,
      nombre: t.nombre,
      encargado: t.encargado === 1 || t.encargado === true,
      cedula: t.cedula || null,
      email: t.email || null
    });
  });

  return { participantesPorProyecto, tutoresPorProyecto };
}

async function obtenerPersonasDeProyecto(proyectoId) {
  const [participantesRows] = await db.query(
    `SELECT id, nombre, cedula, email
     FROM participantes
     WHERE proyecto_id = ?`,
    [proyectoId]
  );

  const [tutoresRows] = await db.query(
    `SELECT id, nombre, encargado, cedula, email
     FROM tutores
     WHERE proyecto_id = ?`,
    [proyectoId]
  );

  const participantes = participantesRows.map(p => ({
    id: p.id,
    nombre: p.nombre,
    cedula: p.cedula || null,
    email: p.email || null
  }));

  const tutores = tutoresRows.map(t => ({
    id: t.id,
    nombre: t.nombre,
    encargado: t.encargado === 1 || t.encargado === true,
    cedula: t.cedula || null,
    email: t.email || null
  }));

  return { participantes, tutores };
}

// Colores institucionales UPSE en formato RGB (0-255) para jsPDF
const COLOR_AZUL = [0, 51, 102];
const COLOR_GRIS = [100, 116, 139];
const COLOR_GRIS_CLARO = [248, 250, 252];
const COLOR_BLANCO = [255, 255, 255];

function generarPdfBuffer({ titulo, subtitulo, descripcion, estadisticas, tablaTitulo, tablaHeaders, tablaFilas }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 50;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_AZUL);
  doc.text(titulo, pageWidth / 2, y, { align: 'center' });
  y += 22;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_GRIS);
  if (subtitulo) {
    doc.text(subtitulo, pageWidth / 2, y, { align: 'center' });
    y += 16;
  }
  const fechaTexto = `Generado: ${new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })}`;
  doc.text(fechaTexto, pageWidth / 2, y, { align: 'center' });
  y += 24;

  if (descripcion) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const lineas = doc.splitTextToSize(`Descripcion: ${descripcion}`, pageWidth - 80);
    doc.text(lineas, 40, y);
    y += lineas.length * 12 + 10;
  }

  if (estadisticas && estadisticas.length) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_AZUL);
    doc.text('Resumen', 40, y);
    y += 16;

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    estadisticas.forEach(linea => {
      doc.text(linea, 40, y);
      y += 14;
    });
    y += 10;
  }

  if (tablaFilas && tablaFilas.length) {
    if (tablaTitulo) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLOR_AZUL);
      doc.text(tablaTitulo, 40, y);
      y += 10;
    }

    autoTable(doc, {
      startY: y + 6,
      head: [tablaHeaders],
      body: tablaFilas,
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9.5, cellPadding: 6, halign: 'center' },
      headStyles: { fillColor: COLOR_AZUL, textColor: COLOR_BLANCO, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLOR_GRIS_CLARO }
    });

    y = doc.lastAutoTable.finalY + 20;
  } else {
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_GRIS);
    doc.text('No hay evaluaciones registradas para este proyecto', pageWidth / 2, y + 20, { align: 'center' });
    y += 50;
  }

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_GRIS);
  doc.text(
    'Sistema de Evaluacion de Proyectos - Powered by UPSE',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 30,
    { align: 'center' }
  );

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

// =====================================
// STATS GENERALES
// =====================================
exports.stats = async (req, res) => {
  try {
    const [[proyectos]] = await db.query('SELECT COUNT(*) AS total FROM proyectos');
    const [[evaluaciones]] = await db.query('SELECT COUNT(*) AS total FROM evaluaciones');
    const [[completadas]] = await db.query("SELECT COUNT(*) AS total FROM evaluaciones WHERE estado = 'evaluado'");

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
      promedio = num(promedioResult[0].promedio);
    } catch (e) {
      promedio = 0;
    }

    return res.json({
      ok: true,
      data: {
        proyectos: num(proyectos.total),
        evaluaciones: num(evaluaciones.total),
        completadas: num(completadas.total),
        promedio: Math.round(promedio * 10) / 10
      }
    });

  } catch (error) {
    console.error('ERROR STATS:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo estadísticas' });
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

    const data = rows.map(r => ({
      proyecto: r.proyecto,
      puntaje_total: num(r.puntaje_total),
      promedio: num(r.promedio)
    }));

    return res.json({ ok: true, data });

  } catch (error) {
    console.error('ERROR RANKING:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error generando ranking' });
  }
};

// =====================================
// REPORTES POR PROYECTO
// =====================================
// ✅ CORREGIDO: antes esta consulta agrupaba por (proyecto, evaluador)
// y calculaba AVG(n.puntaje) — es decir, el promedio de puntos POR
// CRITERIO SUELTO (ej. una escala de niveles 1-4), no el puntaje TOTAL
// de cada evaluación. Además, el campo `promedio` del proyecto se
// sobrescribía en cada fila, quedando con el valor del último
// evaluador procesado en vez de un promedio real entre todos.
//
// Ahora: se agrupa por EVALUACIÓN (una fila = un evaluador evaluando
// un proyecto), se calcula SUM(n.puntaje) = puntaje TOTAL de esa
// evaluación (comparable contra el puntaje_maximo de la rúbrica), y
// el `promedio` del proyecto es el promedio de esos puntajes totales
// entre todos los evaluadores. También se agrega `puntajeMaximo` real
// (desde la tabla `rubricas`) para que el frontend calcule % correcto.
exports.proyectos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.nombre AS proyecto,
        p.area,
        p.nivel,
        p.concurso_id AS concursoId,
        e.id AS evaluacionId,
        e.estado AS estadoEvaluacion,
        u.nombre AS evaluador,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntajeTotalEvaluacion
      FROM proyectos p
      LEFT JOIN evaluaciones e ON e.proyecto_id = p.id
      LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      LEFT JOIN niveles n ON n.id = d.nivel_id
      LEFT JOIN usuarios u ON u.id = e.evaluador_id
      GROUP BY p.id, p.nombre, p.area, p.nivel, p.concurso_id, e.id, e.estado, u.id, u.nombre, u.rol
      ORDER BY p.nombre ASC
    `);

    // Puntaje máximo real de cada rúbrica, por concurso
    const [rubricas] = await db.query(`SELECT concurso_id, puntaje_maximo FROM rubricas`);
    const puntajeMaximoPorConcurso = {};
    rubricas.forEach(r => {
      puntajeMaximoPorConcurso[r.concurso_id] = num(r.puntaje_maximo);
    });

    const proyectos = [];
    rows.forEach(row => {
      let proyecto = proyectos.find(item => item.id === row.id);
      if (!proyecto) {
        proyecto = {
          id: row.id,
          proyecto: row.proyecto,
          area: row.area || null,
          nivel: row.nivel || null,
          concursoId: row.concursoId || null,
          puntajeMaximo: puntajeMaximoPorConcurso[row.concursoId] || 100,
          evaluaciones: 0,
          promedio: 0,
          evaluadores: [],
          participantes: [],
          tutores: []
        };
        proyectos.push(proyecto);
      }

      // El LEFT JOIN puede traer una fila "vacía" (evaluacionId null)
      // si el proyecto todavía no tiene ninguna evaluación asignada.
      if (row.evaluacionId) {
        proyecto.evaluaciones++;
        proyecto.evaluadores.push({
          nombre: row.evaluador,
          rol: row.rol,
          puntaje: num(row.puntajeTotalEvaluacion)
        });
      }
    });

    // promedio = promedio de los PUNTAJES TOTALES por evaluador
    // (no del promedio de criterios sueltos)
    proyectos.forEach(p => {
      if (p.evaluadores.length > 0) {
        const suma = p.evaluadores.reduce((acc, e) => acc + (e.puntaje || 0), 0);
        p.promedio = Math.round((suma / p.evaluadores.length) * 100) / 100;
      }
    });

    const proyectoIds = proyectos.map(p => p.id);
    const { participantesPorProyecto, tutoresPorProyecto } = await obtenerPersonasPorProyectos(proyectoIds);

    proyectos.forEach(p => {
      p.participantes = participantesPorProyecto[p.id] || [];
      p.tutores = tutoresPorProyecto[p.id] || [];
    });

    return res.json({ ok: true, data: proyectos });

  } catch (error) {
    console.error('ERROR REPORTES PROYECTOS:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo reportes' });
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

    rows.forEach(row => sheet.addRow({
      proyecto: row.proyecto,
      evaluador: row.evaluador,
      rol: row.rol,
      puntaje: num(row.puntaje),
      promedio: num(row.promedio)
    }));

    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-evaluaciones.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('ERROR EXPORTAR EXCEL:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error generando Excel' });
  }
};

// =====================================
// EXPORTAR REPORTE EXCEL POR PROYECTO
// =====================================
exports.exportarProyecto = async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.proyectoId);

    const [proyectos] = await db.query(
      `SELECT id, nombre FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado' });
    }

    const proyecto = proyectos[0];

    const [rawRows] = await db.query(`
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

    const rows = rawRows.map(r => ({
      evaluador: r.evaluador,
      rol: r.rol,
      puntaje: num(r.puntaje),
      promedio: num(r.promedio)
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Reporte ${proyecto.nombre}`);

    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `REPORTE DE EVALUACIÓN - ${proyecto.nombre.toUpperCase()}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF003366' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

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
      rowData.values = [row.evaluador, row.rol, row.puntaje, row.promedio];
      rowData.alignment = { vertical: 'middle' };
      rowData.height = 25;
      rowIndex++;
    });

    if (rows.length > 0) {
      const totalRow = sheet.getRow(rowIndex);
      totalRow.values = [
        'TOTAL',
        '',
        rows.reduce((sum, r) => sum + r.puntaje, 0).toFixed(2),
        (rows.reduce((sum, r) => sum + r.promedio, 0) / rows.length).toFixed(2)
      ];
      totalRow.font = { bold: true };
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
      totalRow.height = 25;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${nombreSeguro(proyecto.nombre)}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('ERROR EXPORTAR PROYECTO EXCEL:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error generando Excel del proyecto' });
  }
};

// =====================================
// DETALLE DE PROYECTO
// =====================================
// (Ya calculaba el promedio correctamente: SUM por evaluación, luego
// AVG de esas sumas. Solo se agregó el puntajeMaximo real de la rúbrica.)
exports.detalleProyecto = async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.proyectoId);

    const [proyectos] = await db.query(
      `SELECT id, nombre, descripcion, area, nivel, concurso_id AS concursoId FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado' });
    }

    const proyecto = proyectos[0];

    const [evaluacionesRaw] = await db.query(`
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

    const evaluaciones = evaluacionesRaw.map(e => ({
      ...e,
      puntaje_total: num(e.puntaje_total)
    }));

    const [evaluadoresRaw] = await db.query(`
      SELECT 
        u.id AS evaluador_id,
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

    const evaluadores = evaluadoresRaw.map(e => ({
      evaluadorId: e.evaluador_id,
      nombre: e.nombre,
      rol: e.rol,
      puntaje: num(e.puntaje),
      promedio: num(e.promedio)
    }));

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

    // Puntaje máximo real de la rúbrica de este concurso
    let puntajeMaximo = 100;
    if (proyecto.concursoId) {
      const [rubricaRows] = await db.query(
        `SELECT puntaje_maximo FROM rubricas WHERE concurso_id = ? LIMIT 1`,
        [proyecto.concursoId]
      );
      if (rubricaRows.length > 0) {
        puntajeMaximo = num(rubricaRows[0].puntaje_maximo) || 100;
      }
    }

    const { participantes, tutores } = await obtenerPersonasDeProyecto(proyectoId);

    return res.json({
      ok: true,
      data: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion || '',
        area: proyecto.area || null,
        nivel: proyecto.nivel || null,
        concursoId: proyecto.concursoId || null,
        evaluaciones,
        evaluadores,
        participantes,
        tutores,
        promedio: num(promedioResult[0]?.promedio),
        puntajeMaximo,
        totalEvaluaciones: evaluaciones.length
      }
    });

  } catch (error) {
    console.error('ERROR DETALLE PROYECTO:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo detalle del proyecto' });
  }
};

// =====================================
// DETALLE COMPLETO: RESPUESTAS DE UN EVALUADOR EN UN PROYECTO
// =====================================
exports.detalleEvaluacion = async (req, res) => {
  try {
    const evaluacionId = parseInt(req.params.evaluacionId);

    const [cabecera] = await db.query(`
      SELECT 
        e.id,
        e.estado,
        e.observaciones,
        e.fecha_evaluacion,
        p.nombre AS proyectoNombre,
        c.nombre AS concursoNombre,
        u.nombre AS evaluadorNombre,
        u.rol AS evaluadorRol,
        r.nombre AS rubricaNombre,
        r.puntaje_maximo AS puntajeMaximo
      FROM evaluaciones e
      JOIN proyectos p ON p.id = e.proyecto_id
      LEFT JOIN concursos c ON c.id = p.concurso_id
      JOIN usuarios u ON u.id = e.evaluador_id
      JOIN rubricas r ON r.concurso_id = p.concurso_id
      WHERE e.id = ?
    `, [evaluacionId]);

    if (cabecera.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Evaluación no encontrada' });
    }

    const info = cabecera[0];

    const [detallesRaw] = await db.query(`
      SELECT 
        s.nombre AS seccion,
        cr.texto AS criterio,
        n.nombre AS nivel,
        n.puntaje AS puntaje
      FROM detalles_evaluacion d
      JOIN criterios cr ON cr.id = d.criterio_id
      JOIN secciones s ON s.id = cr.seccion_id
      JOIN niveles n ON n.id = d.nivel_id
      WHERE d.evaluacion_id = ?
      ORDER BY s.orden, cr.orden
    `, [evaluacionId]);

    const detalles = detallesRaw.map(d => ({
      ...d,
      puntaje: num(d.puntaje)
    }));

    return res.json({
      ok: true,
      data: {
        id: info.id,
        estado: info.estado,
        observaciones: info.observaciones,
        fecha: info.fecha_evaluacion,
        proyectoNombre: info.proyectoNombre,
        concursoNombre: info.concursoNombre,
        evaluadorNombre: info.evaluadorNombre,
        evaluadorRol: info.evaluadorRol,
        rubricaNombre: info.rubricaNombre,
        puntajeMaximo: num(info.puntajeMaximo),
        detalles
      }
    });

  } catch (error) {
    console.error('ERROR DETALLE EVALUACION:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo detalle de la evaluación' });
  }
};

// =====================================
// EXPORTAR PDF GENERAL (con jsPDF)
// =====================================
exports.exportarPDF = async (req, res) => {
  try {
    const [rawRows] = await db.query(`
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

    const rows = rawRows.map(r => ({
      proyecto: r.proyecto,
      evaluador: r.evaluador,
      rol: r.rol,
      puntaje: num(r.puntaje),
      promedio: num(r.promedio)
    }));

    const totalProyectos = new Set(rows.map(r => r.proyecto)).size;
    const totalEvaluadores = new Set(rows.map(r => r.evaluador)).size;
    const promedioGeneral = rows.reduce((sum, r) => sum + r.promedio, 0) / (rows.length || 1);

    const pdfBuffer = generarPdfBuffer({
      titulo: 'REPORTE DE EVALUACIONES',
      estadisticas: [
        `Total de proyectos: ${totalProyectos}`,
        `Total de evaluadores: ${totalEvaluadores}`,
        `Promedio general: ${promedioGeneral.toFixed(2)} pts`
      ],
      tablaHeaders: ['Proyecto', 'Evaluador', 'Rol', 'Puntaje', 'Promedio'],
      tablaFilas: rows.map(r => [
        r.proyecto || 'N/A',
        r.evaluador || 'N/A',
        r.rol || 'N/A',
        r.puntaje.toFixed(2),
        r.promedio.toFixed(2)
      ])
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-evaluaciones-${new Date().toISOString().split('T')[0]}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('ERROR EXPORTAR PDF:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error generando PDF: ' + error.message });
  }
};

// =====================================
// EXPORTAR PDF POR PROYECTO (con jsPDF)
// =====================================
exports.exportarPDFProyecto = async (req, res) => {
  try {
    const proyectoId = parseInt(req.params.proyectoId);

    const [proyectos] = await db.query(
      `SELECT id, nombre, descripcion FROM proyectos WHERE id = ?`,
      [proyectoId]
    );

    if (proyectos.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado' });
    }

    const proyecto = proyectos[0];

    const [rawRows] = await db.query(`
      SELECT
        u.nombre AS evaluador,
        u.rol,
        ROUND(SUM(n.puntaje), 2) AS puntaje,
        ROUND(AVG(n.puntaje), 2) AS promedio,
        COUNT(DISTINCT e.id) AS total_evaluaciones
      FROM evaluaciones e
      JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      JOIN niveles n ON n.id = d.nivel_id
      JOIN usuarios u ON u.id = e.evaluador_id
      WHERE e.proyecto_id = ?
      GROUP BY u.id, u.nombre, u.rol
      ORDER BY puntaje DESC
    `, [proyectoId]);

    const rows = rawRows.map(r => ({
      evaluador: r.evaluador,
      rol: r.rol,
      puntaje: num(r.puntaje),
      promedio: num(r.promedio),
      total_evaluaciones: num(r.total_evaluaciones)
    }));

    const nombreArchivo = rows.length === 0
      ? `reporte-${nombreSeguro(proyecto.nombre)}-sin-evaluaciones.pdf`
      : `reporte-${nombreSeguro(proyecto.nombre)}-${new Date().toISOString().split('T')[0]}.pdf`;

    const totalEvaluadores = rows.length;
    const promedioGeneral = rows.length
      ? rows.reduce((sum, r) => sum + r.promedio, 0) / rows.length
      : 0;
    const puntajeTotal = rows.reduce((sum, r) => sum + r.puntaje, 0);

    const pdfBuffer = generarPdfBuffer({
      titulo: 'REPORTE DE EVALUACIÓN',
      subtitulo: `Proyecto: ${proyecto.nombre.toUpperCase()}`,
      descripcion: proyecto.descripcion || null,
      estadisticas: rows.length ? [
        `Total de evaluadores: ${totalEvaluadores}`,
        `Puntaje total: ${puntajeTotal.toFixed(2)} pts`,
        `Promedio general: ${promedioGeneral.toFixed(2)} pts`
      ] : [], 
      tablaTitulo: rows.length ? 'Evaluadores' : null,
      tablaHeaders: ['Evaluador', 'Rol', 'Puntaje', 'Promedio'],
      tablaFilas: rows.map(r => [
        r.evaluador || 'N/A',
        r.rol || 'N/A',
        r.puntaje.toFixed(2),
        r.promedio.toFixed(2)
      ])
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('ERROR EXPORTAR PDF PROYECTO:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error generando PDF del proyecto: ' + error.message });
  }
};