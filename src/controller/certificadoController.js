const db = require('../config/db');
const { jsPDF } = require('jspdf');

const ENTIDAD = 'Universidad Estatal Península de Santa Elena';

function generarCodigo() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `UPSE-${year}-${random}`;
}

const certificadosController = {

  /**
   * GET /api/certificados (admin)
   */
  async getAll(req, res) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM certificados ORDER BY id DESC'
      );
      return res.json({ ok: true, data: rows });
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

      return res.json({ ok: true, data: rows[0] });
    } catch (error) {
      console.error('ERROR obtener certificado:', error.message);
      return res.status(500).json({ ok: false, mensaje: 'Error al obtener el certificado' });
    }
  },

  /**
   * POST /api/certificados/generar (admin)
   * Body: { proyectoId, participanteNombre, participanteCedula, tipoCertificado }
   */
  async generar(req, res) {
    try {
      const { proyectoId, participanteNombre, participanteCedula, tipoCertificado } = req.body;

      if (!proyectoId || !participanteNombre || !participanteCedula || !tipoCertificado) {
        return res.status(400).json({
          ok: false,
          mensaje: 'proyectoId, participanteNombre, participanteCedula y tipoCertificado son obligatorios'
        });
      }

      // Obtener datos del proyecto y su concurso para armar el contenido
      const [proyectos] = await db.query(`
        SELECT p.nombre AS proyecto_nombre, c.nombre AS concurso_nombre
        FROM proyectos p
        LEFT JOIN concursos c ON c.id = p.concurso_id
        WHERE p.id = ?
      `, [proyectoId]);

      if (proyectos.length === 0) {
        return res.status(404).json({ ok: false, mensaje: 'Proyecto no encontrado' });
      }

      const { proyecto_nombre, concurso_nombre } = proyectos[0];

      const contenido = `Se certifica que ${participanteNombre.trim()}, con cédula ${participanteCedula.trim()}, ` +
        `obtuvo el reconocimiento de ${tipoCertificado.trim()} por su participación con el proyecto ` +
        `"${proyecto_nombre}"${concurso_nombre ? ` en el concurso "${concurso_nombre}"` : ''}, ` +
        `organizado por la ${ENTIDAD}.`;

      // Generar código único (reintenta si por casualidad choca)
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
        `INSERT INTO certificados (codigo, entidad_certifica, tipo_certificado, nombre, cedula, contenido, fecha_emision)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [codigo, ENTIDAD, tipoCertificado.trim(), participanteNombre.trim(), participanteCedula.trim(), contenido, fechaEmision]
      );

      return res.status(201).json({
        ok: true,
        mensaje: 'Certificado generado correctamente',
        data: {
          id: result.insertId,
          codigo,
          entidadCertifica: ENTIDAD,
          tipoCertificado: tipoCertificado.trim(),
          nombre: participanteNombre.trim(),
          cedula: participanteCedula.trim(),
          contenido,
          fechaEmision
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
        'SELECT codigo, entidad_certifica, tipo_certificado, nombre, contenido, fecha_emision FROM certificados WHERE codigo = ?',
        [codigo.trim().toUpperCase()]
      );

      if (rows.length === 0) {
        return res.json({ ok: true, valido: false });
      }

      const c = rows[0];

      return res.json({
        ok: true,
        valido: true,
        data: {
          codigo: c.codigo,
          entidadCertifica: c.entidad_certifica,
          tipoCertificado: c.tipo_certificado,
          nombre: c.nombre,
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

      const c = rows[0];

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Marco decorativo
      doc.setDrawColor(0, 27, 76);
      doc.setLineWidth(3);
      doc.rect(24, 24, pageWidth - 48, pageHeight - 48);
      doc.setLineWidth(0.75);
      doc.rect(34, 34, pageWidth - 68, pageHeight - 68);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(c.entidad_certifica.toUpperCase(), pageWidth / 2, 90, { align: 'center' });

      doc.setFontSize(30);
      doc.setTextColor(0, 27, 76);
      doc.text(`CERTIFICADO DE ${c.tipo_certificado.toUpperCase()}`, pageWidth / 2, 140, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(60, 60, 60);
      const lineas = doc.splitTextToSize(c.contenido, pageWidth - 180);
      doc.text(lineas, pageWidth / 2, 200, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`Código de verificación: ${c.codigo}`, pageWidth / 2, pageHeight - 70, { align: 'center' });
      doc.text(`Fecha de emisión: ${new Date(c.fecha_emision).toLocaleDateString('es-ES')}`, pageWidth / 2, pageHeight - 55, { align: 'center' });

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
   * Filtra certificados por la cédula del usuario logueado.
   */
  async misCertificados(req, res) {
    try {
      const cedula = req.usuario.cedula;

      const [rows] = await db.query(
        'SELECT * FROM certificados WHERE cedula = ? ORDER BY id DESC',
        [cedula]
      );

      return res.json({ ok: true, data: rows });
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
      const [result] = await db.query('DELETE FROM certificados WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ ok: false, mensaje: 'Certificado no encontrado' });
      }

      return res.json({ ok: true, mensaje: 'Certificado eliminado correctamente' });
    } catch (error) {
      console.error('ERROR eliminar certificado:', error.message);
      return res.status(500).json({ ok: false, mensaje: 'Error al eliminar el certificado' });
    }
  }

};

module.exports = certificadosController;