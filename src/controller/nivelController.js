const db = require('../config/db');

exports.getAll = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM niveles');
  res.json(rows);
};

exports.create = async (req, res) => {
  const { nombre } = req.body;
  await db.query('INSERT INTO niveles (nombre) VALUES (?)', [nombre]);
  res.json({ message: 'Nivel creado' });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  await db.query('UPDATE niveles SET nombre=? WHERE id=?', [nombre, id]);
  res.json({ message: 'Nivel actualizado' });
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM niveles WHERE id=?', [id]);
  res.json({ message: 'Nivel eliminado' });
};