const { db } = require('../config/database.js');

exports.getRanking = (req, res, next) => {
  // SQL AVANÇADO:
  // Seleciona o aluno, os pontos E faz uma sub-consulta para contar as faltas na tabela 'frequencia'
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

  db.all(sql, [], (err, rows) => {
    if (err) { 
      return next(err);
    }
    res.json({ ranking: rows });
  });
};