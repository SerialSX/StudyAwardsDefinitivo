const db = require('../config/database.js');

exports.getRanking = (req, res, next) => {
  const sql = `
    SELECT 
      u.id, 
      u.nome, 
      u.pontuacao_total,
      (SELECT COUNT(*) FROM frequencia f WHERE f.aluno_id = u.id) as total_faltas
    FROM usuarios u 
    WHERE u.tipo = 'ALUNO' 
    ORDER BY u.pontuacao_total DESC
  `;

  db.query(sql, [], (err, result) => {
    if (err) { 
      return next(err);
    }
    // No Postgres, os dados vem em .rows
    res.json({ ranking: result.rows });
  });
};