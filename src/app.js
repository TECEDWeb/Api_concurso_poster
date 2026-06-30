require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const proyectoRoutes = require('./routes/proyectoRoutes');
const evaluacionRoutes = require('./routes/evaluacionRoutes');
const certificadoRoutes = require('./routes/certificadoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const concursoRoutes = require('./routes/concursoRoutes');
const reportesRoutes = require('./routes/reporteRoutes');
const app = express();

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

// =========================
// RUTAS API
// =========================
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/evaluaciones', evaluacionRoutes);
app.use('/api/certificados', certificadoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/concursos', concursoRoutes);
app.use('/api/reportes', reportesRoutes);
// =========================
// HEALTH CHECK
// =========================
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'API funcionando correctamente'
  });
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});

module.exports = app; 