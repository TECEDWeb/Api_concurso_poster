const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function enviarCorreoRecuperacion(destinatario, nombre, enlaceReset) {
  await transporter.sendMail({
    from: `"Sistema de Evaluación UPSE" <${process.env.GMAIL_USER}>`,
    to: destinatario,
    subject: 'Recuperación de contraseña — Sistema de Evaluación UPSE',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #001b4c;">Recuperación de contraseña</h2>
        <p>Hola ${nombre},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña en el Sistema de Evaluación de Proyectos UPSE.</p>
        <p style="margin: 24px 0;">
          <a href="${enlaceReset}" style="background: #001b4c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Restablecer contraseña
          </a>
        </p>
        <p style="color: #64748b; font-size: 13px;">
          Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>
    `
  });
}

module.exports = { enviarCorreoRecuperacion };