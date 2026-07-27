const db = require('../config/db');
const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');
const config = require('../config/certificadosConfig');
const LogsService = require('../services/logsService');

function generarCodigo() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `UPSE-${year}-${random}`;
}

function formatearFechaLarga(fechaISO) {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const fecha = fechaISO instanceof Date ? fechaISO.toISOString().split('T')[0] : fechaISO;
  const [y, m, d] = fecha.split('-').map(Number);
  return `${d} de ${meses[m - 1]} de ${y}`;
}

function cargarLogoBase64(rutaAbsoluta) {
  try {
    if (fs.existsSync(rutaAbsoluta)) {
      const buffer = fs.readFileSync(rutaAbsoluta);
      const ext = path.extname(rutaAbsoluta).replace('.', '').toUpperCase();
      return { data: buffer.toString('base64'), format: ext === 'JPG' ? 'JPEG' : ext };
    }
  } catch (e) {
    console.warn('No se pudo cargar el logo:', rutaAbsoluta, e.message);
  }
  return null;
}

/**
 * Renderiza texto respetando marcadores **negrita** dentro del string,
 * haciendo wrap manual palabra por palabra dentro de maxWidth.
 * jsPDF no soporta negrita/normal mezclado en un solo doc.text(), así
 * que este helper construye la línea palabra por palabra alternando
 * la fuente según corresponda.
 */
function renderTextoConNegritas(doc, texto, x, startY, maxWidth, fontSize, lineHeight) {
  const tokens = texto.split(/(\*\*[^*]+\*\*)/g).filter(t => t.length > 0);
  const palabras = [];

  tokens.forEach(token => {
    const esNegrita = token.startsWith('**') && token.endsWith('**');
    const limpio = esNegrita ? token.slice(2, -2) : token;
    limpio.split(' ').forEach(w => {
      if (w) palabras.push({ texto: w, negrita: esNegrita });
    });
  });

  let cursorX = x;
  let cursorY = startY;
  doc.setFontSize(fontSize);

  palabras.forEach(palabra => {
    doc.setFont('helvetica', palabra.negrita ? 'bold' : 'normal');
    const ancho = doc.getTextWidth(palabra.texto + ' ');
    if (cursorX + ancho > x + maxWidth) {
      cursorX = x;
      cursorY += lineHeight;
    }
    doc.text(palabra.texto, cursorX, cursorY);
    cursorX += ancho;
  });

  return cursorY;
}

function mapearFilaCertificado(row) {
  return {
    ...row,
    firmantes: (() => {
      if (!row.firmantes) return config.FIRMANTES_DEFAULT;
      try {
        return typeof row.firmantes === 'string' ? JSON.parse(row.firmantes) : row.firmantes;
      } catch {
        return config.FIRMANTES_DEFAULT;
      }
    })()
  };
}

const certificadosController = {

  /**
   * GET /api/certificados (admin)
   */
  async getAll(req, res) {
    try {
      const [rows] = await db.query('SELECT * FROM certificados ORDER BY id DESC');
      return res.json({ ok: true, data: rows.map(mapearFilaCertificado) });
    } catch (error) {
      console.error('ERROR getAll certificados:', error.message);
      return res.status(500).json({ ok: false, mensaje: 'Error al obtener certificados' });
    }
  },

  /**
   * GET /api/certificados/:id (admin)
   */
  async obtener(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM certificados WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({ ok: false, mensaje: 'Certificado no encontrado' });
      }

      return res.json({ ok: true, data: mapearFilaCertificado(rows[0]) });
    } catch (error) {
      console.error('ERROR obtener certificado:', error.message);
      return res.status(500).json({ ok: false, mensaje: 'Error al obtener el certificado' });
    }
  },

  /**
   * POST /api/certificados/generar (admin)
   */
  async generar(req, res) {
    try {
      const {
        proyectoId, participanteNombre, participanteCedula, tipoCertificado,
        rol, nombreEvento, categoriaActividad, fechaEvento, lugar, firmantes
      } = req.body;

      if (!proyectoId || !participanteNombre || !participanteCedula || !tipoCertificado
        || !nombreEvento || !categoriaActividad) {
        return res.status(400).json({
          ok: false,
          mensaje: 'proyectoId, participanteNombre, participanteCedula, tipoCertificado, ' +
                    'nombreEvento y categoriaActividad son obligatorios'
        });
      }

      const [proyectos] = await db.query(`
        SELECT p.id AS proyecto_id, p.nombre AS proyecto_nombre, p.concurso_id
        FROM proyectos p
        WHERE p.id = ?
      `, [proyectoId]);

      if (proyectos.length === 0) {
        return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado' });
      }

      const { proyecto_nombre, concurso_id } = proyectos[0];
      const rolFinal = rol === 'tutor' ? 'tutor' : 'participante';
      const lugarFinal = (lugar && lugar.trim()) || config.LUGAR_DEFAULT;
      const fechaEventoFinal = fechaEvento || new Date().toISOString().split('T')[0];
      const firmantesFinal = Array.isArray(firmantes) && firmantes.length > 0
        ? firmantes
        : config.FIRMANTES_DEFAULT;

      const fechaEventoTexto = formatearFechaLarga(fechaEventoFinal);

      const contenido =
        `Por su participación en el ${categoriaActividad.trim()} presentado en el ` +
        `**${nombreEvento.trim()}**, con el tema "**${proyecto_nombre}**", realizado en la ` +
        `${config.UNIVERSIDAD}, el ${fechaEventoTexto}.`;

      let codigo;
      let intentos = 0;
      do {
        codigo = generarCodigo();
        const [existe] = await db.query('SELECT id FROM certificados WHERE codigo = ?', [codigo]);
        if (existe.length === 0) break;
        intentos++;
      } while (intentos < 5);

      const fechaEmision = new Date().toISOString().split('T')[0];

      const [result] = await db.query(
        `INSERT INTO certificados
          (proyecto_id, concurso_id, rol, codigo, entidad_certifica, tipo_certificado,
           nombre_evento, categoria_actividad, tema_proyecto, nombre, cedula, contenido,
           fecha_emision, lugar, fecha_evento, firmantes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          proyectoId, concurso_id, rolFinal, codigo, config.ENTIDAD_CERTIFICA, tipoCertificado.trim(),
          nombreEvento.trim(), categoriaActividad.trim(), proyecto_nombre,
          participanteNombre.trim(), participanteCedula.trim(), contenido,
          fechaEmision, lugarFinal, fechaEventoFinal, JSON.stringify(firmantesFinal)
        ]
      );

      // ✅ LOG: Certificado generado
      try {
        await LogsService.registrarActividad({
          usuario: req.usuario,
          tipo: 'certificado',
          accion: 'crear',
          entidad_id: result.insertId,
          entidad_nombre: `Certificado: ${participanteNombre.trim()}`,
          descripcion: `Se generó certificado para "${participanteNombre.trim()}" (código: ${codigo})`,
          detalles: { 
            proyectoId, 
            participanteNombre: participanteNombre.trim(),
            participanteCedula: participanteCedula.trim(),
            tipoCertificado,
            codigo
          },
          req
        });
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.status(201).json({
        ok: true,
        mensaje: 'Certificado generado correctamente',
        data: {
          id: result.insertId,
          proyecto_id: proyectoId,
          concurso_id,
          rol: rolFinal,
          codigo,
          entidad_certifica: config.ENTIDAD_CERTIFICA,
          tipo_certificado: tipoCertificado.trim(),
          nombre_evento: nombreEvento.trim(),
          categoria_actividad: categoriaActividad.trim(),
          tema_proyecto: proyecto_nombre,
          nombre: participanteNombre.trim(),
          cedula: participanteCedula.trim(),
          contenido,
          fecha_emision: fechaEmision,
          lugar: lugarFinal,
          fecha_evento: fechaEventoFinal,
          firmantes: firmantesFinal
        }
      });

    } catch (error) {
      console.error('ERROR generar certificado:', error.message);
      return res.status(500).json({ ok: false, mensaje: 'Error al generar el certificado' });
    }
  },

  /**
   * GET /api/certificados/validar/:codigo (PÚBLICO, sin auth)
   */
  async validarPublico(req, res) {
    try {
      const { codigo } = req.params;

      const [rows] = await db.query(
        'SELECT * FROM certificados WHERE codigo = ?',
        [codigo.trim().toUpperCase()]
      );

      if (rows.length === 0) {
        return res.json({ ok: true, valido: false });
      }

      const c = mapearFilaCertificado(rows[0]);

      return res.json({
        ok: true,
        valido: true,
        data: {
          codigo: c.codigo,
          entidadCertifica: c.entidad_certifica,
          tipoCertificado: c.tipo_certificado,
          nombre: c.nombre,
          rol: c.rol,
          nombreEvento: c.nombre_evento,
          contenido: c.contenido,
          fechaEmision: c.fecha_emision
        }
      });

    } catch (error) {
      console.error('ERROR validar certificado:', error.message);
      return res.status(500).json({ ok: false, mensaje: 'Error al validar el certificado' });
    }
  },

  /**
   * GET /api/certificados/:id/pdf (admin)
   */
  async descargarPdf(req, res) {
    try {
      const { id } = req.params;

      const [rows] = await db.query('SELECT * FROM certificados WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({ ok: false, mensaje: 'Certificado no encontrado' });
      }

      const c = mapearFilaCertificado(rows[0]);
      const firmantes = c.firmantes;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;

      // ===== MARCO DECORATIVO =====
      doc.setDrawColor(0, 27, 76);
      doc.setLineWidth(3);
      doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 12, 12);
      doc.setLineWidth(0.75);
      doc.roundedRect(margin + 10, margin + 10, pageWidth - margin * 2 - 20, pageHeight - margin * 2 - 20, 8, 8);

      // Acento dorado institucional
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(4);
      doc.line(margin + 10, margin + 10, pageWidth / 2, margin + 10);

      // ===== LOGOS =====
      const logoCist = cargarLogoBase64(config.LOGOS.cist);
      const logoUpse = cargarLogoBase64(config.LOGOS.upse);

      if (logoCist) {
        doc.addImage(logoCist.data, logoCist.format, margin + 30, margin + 20, 70, 70);
      }

      if (logoUpse) {
        doc.addImage(logoUpse.data, logoUpse.format, pageWidth / 2 - 90, margin + 20, 180, 60);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(0, 27, 76);
        doc.text('UPSE', pageWidth / 2, margin + 55, { align: 'center' });
      }

      // ===== ENTIDAD QUE CERTIFICA =====
      let y = margin + 115;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(51, 65, 85);
      const entidadLineas = doc.splitTextToSize(c.entidad_certifica, pageWidth - margin * 4);
      doc.text(entidadLineas, pageWidth / 2, y, { align: 'center' });
      y += entidadLineas.length * 16 + 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(71, 85, 105);
      doc.text('OTORGA EL PRESENTE', pageWidth / 2, y, { align: 'center' });
      y += 36;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(38);
      doc.setTextColor(0, 27, 76);
      doc.text('CERTIFICADO', pageWidth / 2, y, { align: 'center' });
      y += 44;

      // ===== NOMBRE DEL BENEFICIARIO =====
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(20);
      doc.setTextColor(51, 65, 85);
      doc.text('A:', margin + 60, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(0, 27, 76);
      doc.text(c.nombre, margin + 82, y);
      y += 34;

      // ===== PÁRRAFO CON NEGRITAS =====
      doc.setTextColor(60, 60, 60);
      const finalY = renderTextoConNegritas(
        doc, c.contenido, margin + 60, y, pageWidth - margin * 2 - 120, 13, 19
      );
      y = finalY + 40;

      // ===== LUGAR Y FECHA DE EMISIÓN =====
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      const fechaEmisionTexto = formatearFechaLarga(c.fecha_emision);
      doc.text(`${c.lugar}, ${fechaEmisionTexto}`, pageWidth - margin - 60, y, { align: 'right' });

      // ===== BLOQUE DE FIRMAS =====
      const firmaY = pageHeight - margin - 75;
      const anchoDisponible = pageWidth - margin * 2 - 80;
      const colWidth = anchoDisponible / firmantes.length;

      firmantes.forEach((firmante, i) => {
        const colX = margin + 40 + colWidth * i + colWidth / 2;

        doc.setDrawColor(100, 116, 139);
        doc.setLineWidth(0.75);
        doc.line(colX - 85, firmaY, colX + 85, firmaY);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(firmante.nombre, colX, firmaY + 16, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const tituloLineas = doc.splitTextToSize(firmante.titulo, colWidth - 15);
        doc.text(tituloLineas, colX, firmaY + 30, { align: 'center' });
      });

      // ===== CÓDIGO DE VERIFICACIÓN =====
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Código de verificación: ${c.codigo}`, pageWidth / 2, pageHeight - margin - 15, { align: 'center' });

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=certificado-${c.codigo}.pdf`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('ERROR descargar PDF certificado:', error.message);
      return res.status(500).json({ ok: false, mensaje: 'Error al generar el PDF' });
    }
  },

  /**
   * GET /api/certificados/mios (usuario autenticado, cualquier rol)
   */
  async misCertificados(req, res) {
    try {
      const cedula = req.usuario.cedula;

      const [rows] = await db.query(
        'SELECT * FROM certificados WHERE cedula = ? ORDER BY id DESC',
        [cedula]
      );

      return res.json({ ok: true, data: rows.map(mapearFilaCertificado) });
    } catch (error) {
      console.error('ERROR misCertificados:', error.message);
      return res.status(500).json({ ok: false, mensaje: 'Error al obtener tus certificados' });
    }
  },

  /**
   * DELETE /api/certificados/:id (admin)
   */
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      
      // ✅ Obtener datos del certificado antes de eliminar (para el log)
      let certificadoInfo = null;
      try {
        const [certificado] = await db.query(
          'SELECT nombre, codigo FROM certificados WHERE id = ?',
          [id]
        );
        if (certificado.length > 0) {
          certificadoInfo = certificado[0];
        }
      } catch (logError) {
        console.error("Error obteniendo datos para log:", logError);
      }

      const [result] = await db.query('DELETE FROM certificados WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ ok: false, mensaje: 'Certificado no encontrado' });
      }

      // ✅ LOG: Certificado eliminado
      try {
        if (certificadoInfo) {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'certificado',
            accion: 'eliminar',
            entidad_id: parseInt(id),
            entidad_nombre: `Certificado: ${certificadoInfo.nombre}`,
            descripcion: `Se eliminó el certificado de "${certificadoInfo.nombre}" (código: ${certificadoInfo.codigo})`,
            detalles: { codigo: certificadoInfo.codigo },
            req
          });
        } else {
          await LogsService.registrarActividad({
            usuario: req.usuario,
            tipo: 'certificado',
            accion: 'eliminar',
            entidad_id: parseInt(id),
            entidad_nombre: `Certificado ID: ${id}`,
            descripcion: `Se eliminó el certificado ID ${id}`,
            detalles: { id },
            req
          });
        }
      } catch (logError) {
        console.error("Error registrando log:", logError);
        // No interrumpimos el flujo si falla el log
      }

      return res.json({ ok: true, mensaje: 'Certificado eliminado correctamente' });
    } catch (error) {
      console.error('ERROR eliminar certificado:', error.message);
      return res.status(500).json({ ok: false, mensaje: 'Error al eliminar el certificado' });
    }
  }

};

module.exports = certificadosController;