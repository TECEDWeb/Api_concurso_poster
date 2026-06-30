const db = require('../config/db');

exports.getAll = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM secciones');
  res.json(rows);
};

exports.create = async (req, res) => {
  const { nombre } = req.body;
  await db.query('INSERT INTO secciones (nombre) VALUES (?)', [nombre]);
  res.json({ message: 'Sección creada' });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  await db.query('UPDATE secciones SET nombre=? WHERE id=?', [nombre, id]);
  res.json({ message: 'Sección actualizada' });
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM secciones WHERE id=?', [id]);
  res.json({ message: 'Sección eliminada' });
};