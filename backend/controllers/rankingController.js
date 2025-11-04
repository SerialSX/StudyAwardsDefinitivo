const { db } = require('../config/database.js');

exports.getRanking = (req, res) => {
  const sql = `SELECT id, nome, pontuacao_total FROM usuarios ORDER BY pontuacao_total DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) { 
      return res.status(500).json({ error: err.message }); 
    }
    res.json({ ranking: rows });
  });
};