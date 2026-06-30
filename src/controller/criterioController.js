const db = require('../config/db');

exports.getAll = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM criterios');
  res.json(rows);
};

exports.create = async (req, res) => {
  const { nombre, peso } = req.body;
  await db.query(
    'INSERT INTO criterios (nombre, peso) VALUES (?, ?)',
    [nombre, peso]
  );
  res.json({ message: 'Criterio creado' });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nombre, peso } = req.body;

  await db.query(
    'UPDATE criterios SET nombre=?, peso=? WHERE id=?',
    [nombre, peso, id]
  );

  res.json({ message: 'Criterio actualizado' });
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM criterios WHERE id=?', [id]);
  res.json({ message: 'Criterio eliminado' });
};