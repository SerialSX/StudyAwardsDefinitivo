const db = require('../config/database.js');

exports.getRankingAlunos = (callback) => {
  // Postgres: Query normal
  const sql = `SELECT id, nome, pontuacao_total 
               FROM usuarios 
               WHERE tipo = 'ALUNO' 
               ORDER BY pontuacao_total DESC`;

  db.query(sql, [], (err, res) => {
    if (err) return callback(err, null);
    callback(null, res.rows); // No Postgres os dados ficam em .rows
  });
};