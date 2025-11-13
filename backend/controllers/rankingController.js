// ADICIONEI ESTA LINHA:
const { db } = require('../config/database.js');

exports.getRanking = (req, res, next) => { 
  const sql = `SELECT id, nome, pontuacao_total FROM usuarios WHERE tipo = 'ALUNO' ORDER BY pontuacao_total DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) { 
      return next(err);
    }
    res.json({ ranking: rows });
  });
};