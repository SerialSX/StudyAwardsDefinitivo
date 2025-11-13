const { db } = require('../config/database.js');

exports.getRankingAlunos = (callback) => {
  const sql = `SELECT id, nome, pontuacao_total 
               FROM usuarios 
               WHERE tipo = 'ALUNO' 
               ORDER BY pontuacao_total DESC`;

  db.all(sql, [], (err, rows) => {
    callback(err, rows);
  });
};