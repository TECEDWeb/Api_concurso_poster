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
const asignacionRoutes = require('./routes/asignacionRoutes');
const rubricaRoutes = require('./routes/rubricaRoutes'); // ← AÑADIR ESTA LÍNEA
const evaluadorRoutes = require('./routes/evaluadorRoutes');
const seccionesRoutes = require('./routes/seccionRoutes');
const criterioRoutes = require('./routes/criterioRoutes');
const nivelRoutes = require('./routes/nivelRoutes');
const app = express();

// =========================
// MIDDLEWARE CORS
// =========================
app.use(cors({
  origin: [
    'http://localhost:8100',
    'http://localhost',
    'https://evaluacion.teced.org',
    'https://apievaluacion.teced.org'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.options('*', cors());
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
app.use('/api/asignaciones', asignacionRoutes);
app.use('/api/rubricas', rubricaRoutes); 
app.use('/api/evaluador', evaluadorRoutes);
app.use('/api/secciones', seccionesRoutes);
app.use('/api/criterios', criterioRoutes);
app.use('/api/niveles', nivelRoutes);

// =========================
// HEALTH CHECK
// =========================
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'API funcionando correctamente 🚀'
  });
});

// =========================
// ROOT API INFO
// =========================
app.get('/api', (req, res) => {
  res.json({
    ok: true,
    message: 'API Evaluación de Proyectos funcionando correctamente 🚀',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      proyectos: '/api/proyectos',
      evaluaciones: '/api/evaluaciones',
      certificados: '/api/certificados',
      dashboard: '/api/dashboard',
      concursos: '/api/concursos',
      reportes: '/api/reportes',
      rubricas: '/api/rubricas', // ← AÑADIR
      health: '/api/health'
    }
  });
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
  console.log(`🔗 API: https://apievaluacion.teced.org`);
});

module.exports = app;