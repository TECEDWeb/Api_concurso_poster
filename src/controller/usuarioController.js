const db = require('../config/db');

exports.getEvaluadores = async (req, res) => {
  try {
    console.log('==============================');
    console.log('📥 GET EVALUADORES REQUEST');
    console.log('URL:', req.originalUrl);
    console.log('METHOD:', req.method);

    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE rol="evaluador"'
    );

    console.log('✅ Evaluadores encontrados:', rows.length);
    console.log('Data:', rows);
    console.log('==============================');

    res.json(rows);

  } catch (err) {
    console.log('==============================');
    console.error('❌ ERROR GET EVALUADORES');
    console.error('Mensaje:', err.message);
    console.error('Stack:', err.stack);
    console.log('==============================');

    res.status(500).json({ message: err.message });
  }
};


exports.create = async (req, res) => {
  try {
    console.log('==============================');
    console.log('📥 CREATE USUARIO REQUEST');
    console.log('Body recibido:', req.body);
    console.log('URL:', req.originalUrl);
    console.log('METHOD:', req.method);

    const { nombre, email, password, rol } = req.body;

    // 🔍 VALIDACIÓN DEBUG
    if (!nombre || !email || !password || !rol) {
      console.log('❌ FALTAN CAMPOS');
      console.log({ nombre, email, password, rol });

      return res.status(400).json({
        message: 'Faltan datos obligatorios'
      });
    }

    const result = await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, password, rol]
    );

    console.log('==============================');
    console.log('✅ USUARIO CREADO');
    console.log('Resultado DB:', result);
    console.log('==============================');

    res.json({
      message: 'Usuario creado',
      data: {
        nombre,
        email,
        rol
      }
    });

  } catch (err) {
    console.log('==============================');
    console.error('❌ ERROR CREATE USUARIO');
    console.error('Mensaje:', err.message);
    console.error('Stack:', err.stack);
    console.log('==============================');

    res.status(500).json({ message: err.message });
  }
};


exports.toggleActivo = async (req, res) => {
  try {
    console.log('==============================');
    console.log('📥 TOGGLE ACTIVO USUARIO');
    console.log('ID:', req.params.id);

    const { id } = req.params;

    const result = await db.query(
      'UPDATE usuarios SET activo = NOT activo WHERE id=?',
      [id]
    );

    console.log('✅ Estado actualizado');
    console.log('Resultado:', result);
    console.log('==============================');

    res.json({ message: 'Estado actualizado' });

  } catch (err) {
    console.log('==============================');
    console.error('❌ ERROR TOGGLE USUARIO');
    console.error(err.message);
    console.log('==============================');

    res.status(500).json({ message: err.message });
  }
};