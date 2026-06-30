const db = require('../config/db');

exports.getAll = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM certificados');
  res.json(rows);
};

exports.validar = async (req, res) => {
  const { id } = req.params;

  await db.query(
    'UPDATE certificados SET validado=1 WHERE id=?',
    [id]
  );

  res.json({ message: 'Certificado validado' });
};

exports.regenerar = async (req, res) => {
  const { id } = req.params;

  res.json({ message: 'Certificado regenerado (pendiente PDF)' });
};