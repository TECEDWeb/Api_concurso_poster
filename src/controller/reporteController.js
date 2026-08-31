const db = require('../config/db');
const ReporteService = require('../services/reporteService');
const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;
const { calcularPuntajeMaximoReal, calcularPuntajesMaximosPorConcursos } = require('../utils/puntajeMaximo');
const LogsService = require('../services/logsService');

// ============================================
// HELPER: validar acceso a concurso
// ============================================
async function validarAccesoConcurso(usuario, concursoId) {
  if (usuario.rol === 'admin') return true;

  if (usuario.rol === 'coordinador') {
    const [rows] = await db.query(
      `SELECT id FROM concursos WHERE id = ? AND coordinador_id = ?`,
      [concursoId, usuario.id]
    );
    return rows.length > 0;
  }

  return false;
}

// ============================================
// HELPER: nombre seguro
// ============================================
function nombreSeguro(nombre) {
  return (nombre || 'proyecto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ============================================
// HELPER: personas por proyectos
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

// ============================================
// HELPER: generar PDF buffer
// ============================================
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

// ============================================
// STATS GENERALES
// ============================================
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
      promedio = Number(promedioResult[0].promedio) || 0;
    } catch (e) {
      promedio = 0;
    }

    try {
      await LogsService.registrarActividad({
        usuario: req.usuario,
        tipo: 'reporte',
        accion: 'consultar',
        entidad_id: null,
        entidad_nombre: 'Estadísticas generales',
        descripcion: `Consultó estadísticas: ${Number(proyectos.total)} proyectos, ${Number(evaluaciones.total)} evaluaciones`,
        detalles: { proyectos: Number(proyectos.total), evaluaciones: Number(evaluaciones.total), completadas: Number(completadas.total), promedio: Math.round(promedio * 10) / 10 },
        req
      });
    } catch (logError) {
      console.error("Error registrando log:", logError);
    }

    return res.json({
      ok: true,
      data: {
        proyectos: Number(proyectos.total),
        evaluaciones: Number(evaluaciones.total),
        completadas: Number(completadas.total),
        promedio: Math.round(promedio * 10) / 10
      }
    });

  } catch (error) {
    console.error('ERROR STATS:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo estadísticas' });
  }
};

// ============================================
// RANKING GENERAL
// ============================================
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
      puntaje_total: Number(r.puntaje_total) || 0,
      promedio: Number(r.promedio) || 0
    }));

    try {
      await LogsService.registrarActividad({
        usuario: req.usuario,
        tipo: 'reporte',
        accion: 'consultar',
        entidad_id: null,
        entidad_nombre: 'Ranking de proyectos',
        descripcion: `Consultó ranking de ${rows.length} proyectos`,
        detalles: { totalProyectos: rows.length },
        req
      });
    } catch (logError) {
      console.error("Error registrando log:", logError);
    }

    return res.json({ ok: true, data });

  } catch (error) {
    console.error('ERROR RANKING:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error generando ranking' });
  }
};

// ============================================
// REPORTES POR PROYECTO - CORREGIDO (SOLO UNA VEZ)
// ============================================
exports.proyectos = async (req, res) => {
  try {
    // 1. OBTENER PROYECTOS CON SUS DATOS BÁSICOS
    const [proyectosRows] = await db.query(`
      SELECT 
        p.id,
        p.nombre AS proyecto,
        p.area,
        p.nivel,
        p.concurso_id AS concursoId
      FROM proyectos p
      ORDER BY p.nombre ASC
    `);

    if (proyectosRows.length === 0) {
      return res.json({ ok: true, data: [] });
    }

    const proyectoIds = proyectosRows.map(p => p.id);

    // 2. OBTENER EVALUACIONES CON EL CONCURSO_ID EXPLÍCITAMENTE
    const [evaluacionesRows] = await db.query(`
      SELECT 
        e.id AS evaluacionId,
        e.proyecto_id AS proyectoId,
        e.estado AS estadoEvaluacion,
        e.observaciones,
        u.id AS evaluadorId,
        u.nombre AS evaluadorNombre,
        u.rol AS evaluadorRol,
        u.email AS evaluadorEmail,
        u.departamento AS evaluadorDepartamento,
        u.cedula AS evaluadorCedula,
        ROUND(SUM(n.puntaje), 2) AS puntajeTotal,
        p.concurso_id AS concursoId
      FROM evaluaciones e
      JOIN usuarios u ON u.id = e.evaluador_id
      JOIN proyectos p ON p.id = e.proyecto_id
      LEFT JOIN detalles_evaluacion d ON d.evaluacion_id = e.id
      LEFT JOIN niveles n ON n.id = d.nivel_id
      WHERE e.proyecto_id IN (?)
      GROUP BY e.id, u.id, u.nombre, u.rol, u.email, u.departamento, u.cedula, 
               e.estado, e.observaciones, p.concurso_id
      ORDER BY e.proyecto_id, e.fecha_evaluacion DESC
    `, [proyectoIds]);

    // 3. OBTENER PUNTAJES MÁXIMOS POR CONCURSO
    const concursoIds = [...new Set(proyectosRows.map(p => p.concursoId).filter(id => id))];
    const puntajeMaximoPorConcurso = await calcularPuntajesMaximosPorConcursos(concursoIds);

    // 4. OBTENER PARTICIPANTES Y TUTORES
    const { participantesPorProyecto, tutoresPorProyecto } = await obtenerPersonasPorProyectos(proyectoIds);

    // 5. CONSTRUIR MAPA DE PROYECTOS
    const proyectosMap = new Map();

    proyectosRows.forEach(row => {
      proyectosMap.set(row.id, {
        id: row.id,
        proyecto: row.proyecto,
        area: row.area || null,
        nivel: row.nivel || null,
        concursoId: row.concursoId || null,
        puntajeMaximo: puntajeMaximoPorConcurso[row.concursoId] || 100,
        evaluadores: [],
        participantes: participantesPorProyecto[row.id] || [],
        tutores: tutoresPorProyecto[row.id] || [],
        evaluaciones: 0,
        promedio: 0
      });
    });

    // 6. AGRUPAR EVALUACIONES POR PROYECTO
    const evaluacionesPorProyecto = new Map();
    evaluacionesRows.forEach(evalRow => {
      const proyectoId = evalRow.proyectoId;
      if (!evaluacionesPorProyecto.has(proyectoId)) {
        evaluacionesPorProyecto.set(proyectoId, []);
      }
      evaluacionesPorProyecto.get(proyectoId).push(evalRow);
    });

    // 7. PROCESAR CADA PROYECTO - FILTRANDO EVALUADORES POR CONCURSO
    for (const [proyectoId, evaluaciones] of evaluacionesPorProyecto) {
      const proyecto = proyectosMap.get(proyectoId);
      if (!proyecto) continue;

      // FILTRAR solo evaluaciones del mismo concurso que el proyecto
      const evaluacionesDelConcurso = evaluaciones.filter(
        e => Number(e.concursoId) === Number(proyecto.concursoId)
      );

      // Solo las evaluaciones completadas (estado = 'evaluado')
      const evaluadas = evaluacionesDelConcurso.filter(e => e.estadoEvaluacion === 'evaluado');

      // Agrupar evaluadores únicos (por nombre para evitar duplicados)
      const evaluadoresUnicos = new Map();

      evaluadas.forEach(ev => {
        const nombre = ev.evaluadorNombre || 'Evaluador sin nombre';
        if (!evaluadoresUnicos.has(nombre)) {
          evaluadoresUnicos.set(nombre, {
            nombre: ev.evaluadorNombre,
            rol: ev.evaluadorRol,
            email: ev.evaluadorEmail || '',
            departamento: ev.evaluadorDepartamento || '',
            cedula: ev.evaluadorCedula || '',
            evaluacionId: ev.evaluacionId,
            puntaje: Number(ev.puntajeTotal) || 0,
            estado: ev.estadoEvaluacion
          });
        }
      });

      proyecto.evaluadores = Array.from(evaluadoresUnicos.values());
      proyecto.evaluaciones = evaluadas.length;

      // Calcular promedio
      if (proyecto.evaluadores.length > 0) {
        const sumaPuntajes = proyecto.evaluadores.reduce((acc, e) => acc + (e.puntaje || 0), 0);
        proyecto.promedio = Math.round((sumaPuntajes / proyecto.evaluadores.length) * 100) / 100;
      }
    }

    // 8. CONVERTIR A ARRAY
    const proyectos = Array.from(proyectosMap.values());

    // 9. REGISTRAR LOG
    try {
      const totalEvaluadores = proyectos.reduce((acc, p) => acc + p.evaluadores.length, 0);
      await LogsService.registrarActividad({
        usuario: req.usuario,
        tipo: 'reporte',
        accion: 'consultar',
        entidad_id: null,
        entidad_nombre: 'Reporte de proyectos',
        descripcion: `Consultó reporte de ${proyectos.length} proyectos con ${totalEvaluadores} evaluadores únicos`,
        detalles: { totalProyectos: proyectos.length, totalEvaluadores },
        req
      });
    } catch (logError) {
      console.error("Error registrando log:", logError);
    }

    return res.json({ ok: true, data: proyectos });

  } catch (error) {
    console.error('ERROR REPORTES PROYECTOS:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo reportes' });
  }
};

// ============================================
// EXPORTAR REPORTE EXCEL GENERAL
// ============================================
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
      puntaje: Number(row.puntaje) || 0,
      promedio: Number(row.promedio) || 0
    }));

    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    try {
      await LogsService.registrarActividad({
        usuario: req.usuario,
        tipo: 'reporte',
        accion: 'exportar',
        entidad_id: null,
        entidad_nombre: 'Exportación Excel general',
        descripcion: `Exportó reporte general en Excel con ${rows.length} registros`,
        detalles: { totalRegistros: rows.length, tipo: 'excel' },
        req
      });
    } catch (logError) {
      console.error("Error registrando log:", logError);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-evaluaciones.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('ERROR EXPORTAR EXCEL:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error generando Excel' });
  }
};

// ============================================
// EXPORTAR REPORTE EXCEL POR PROYECTO
// ============================================
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
      puntaje: Number(r.puntaje) || 0,
      promedio: Number(r.promedio) || 0
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

    try {
      await LogsService.registrarActividad({
        usuario: req.usuario,
        tipo: 'reporte',
        accion: 'exportar',
        entidad_id: proyectoId,
        entidad_nombre: `Exportación Excel: ${proyecto.nombre}`,
        descripcion: `Exportó reporte en Excel del proyecto "${proyecto.nombre}" con ${rows.length} evaluadores`,
        detalles: { proyectoId, totalEvaluadores: rows.length, tipo: 'excel' },
        req
      });
    } catch (logError) {
      console.error("Error registrando log:", logError);
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

// ============================================
// DETALLE DE PROYECTO
// ============================================
exports.detalleProyecto = async (req, res) => {
  // ... (mantén tu código existente)
};

// ============================================
// DETALLE DE EVALUACION
// ============================================
exports.detalleEvaluacion = async (req, res) => {
  // ... (mantén tu código existente)
};

// ============================================
// EXPORTAR PDF GENERAL
// ============================================
exports.exportarPDF = async (req, res) => {
  // ... (mantén tu código existente)
};

// ============================================
// EXPORTAR PDF POR PROYECTO
// ============================================
exports.exportarPDFProyecto = async (req, res) => {
  // ... (mantén tu código existente)
};

// ============================================
// STATS POR CONCURSO
// ============================================
exports.statsByConcurso = async (req, res) => {
  // ... (mantén tu código existente)
};

// ============================================
// EXPORTAR PDF POR CONCURSO
// ============================================
exports.exportarPDFConcurso = async (req, res) => {
  // ... (mantén tu código existente)
};

// ============================================
// EXPORTAR EXCEL POR CONCURSO
// ============================================
exports.exportarExcelConcurso = async (req, res) => {
  // ... (mantén tu código existente)
};

// ============================================
// OBTENER JURADO POR CONCURSO
// ============================================
exports.getJuradoByConcurso = async (req, res) => {
  try {
    const concursoId = parseInt(req.params.concursoId);

    if (!concursoId) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID del concurso es requerido'
      });
    }

    const tieneAcceso = await validarAccesoConcurso(req.usuario, concursoId);
    if (!tieneAcceso) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permisos para ver este concurso'
      });
    }

    const jurado = await ReporteService.getJuradoByConcurso(concursoId);

    return res.json({
      ok: true,
      data: jurado
    });

  } catch (error) {
    console.error('ERROR GET JURADO:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error obteniendo jurado del concurso'
    });
  }
};

// ============================================
// OBTENER EVALUADORES POR CONCURSO (NUEVO)
// ============================================
exports.getEvaluadoresByConcurso = async (req, res) => {
  try {
    const concursoId = parseInt(req.params.concursoId);

    if (!concursoId) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID del concurso es requerido'
      });
    }

    const tieneAcceso = await validarAccesoConcurso(req.usuario, concursoId);
    if (!tieneAcceso) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permisos para ver este concurso'
      });
    }

    // Obtener evaluadores del concurso
    const [evaluadores] = await db.query(`
      SELECT DISTINCT
        u.id,
        u.nombre,
        u.rol,
        u.email,
        u.departamento,
        u.cedula,
        COUNT(DISTINCT a.proyecto_id) AS proyectosAsignados,
        COUNT(DISTINCT CASE WHEN a.estado = 'evaluado' THEN a.proyecto_id END) AS proyectosEvaluados
      FROM usuarios u
      INNER JOIN asignaciones a ON a.evaluador_id = u.id
      INNER JOIN proyectos p ON p.id = a.proyecto_id
      WHERE p.concurso_id = ?
        AND u.rol = 'evaluador'
        AND u.activo = 1
      GROUP BY u.id, u.nombre, u.rol, u.email, u.departamento, u.cedula
      ORDER BY u.nombre ASC
    `, [concursoId]);

    return res.json({
      ok: true,
      data: evaluadores
    });

  } catch (error) {
    console.error('ERROR GET EVALUADORES:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error obteniendo evaluadores del concurso'
    });
  }
};