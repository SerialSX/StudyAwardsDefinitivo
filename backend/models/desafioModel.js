const db = require('../config/database.js');

exports.findDesafiosByAlunoId = (alunoId, callback) => {
  const sql = `
    SELECT 
      d.id, d.titulo, d.descricao, d.pontos, d.prazo_final,
      ad.status, ad.data_conclusao, ad.id as aluno_desafio_id, ad.comprovante_path
    FROM desafios d 
    JOIN aluno_desafios ad ON d.id = ad.desafio_id 
    WHERE ad.aluno_id = $1
  `;
  db.query(sql, [alunoId], (err, res) => {
    if (err) return callback(err);
    callback(null, res.rows);
  });
};

exports.createDesafio = (titulo, descricao, pontos, prazo, profId, callback) => {
  const sql = `
    INSERT INTO desafios (titulo, descricao, pontos, prazo_final, criado_por_professor_id) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING id
  `;
  db.query(sql, [titulo, descricao, pontos, prazo, profId], (err, res) => {
    if (err) return callback(err);
    callback(null, { id: res.rows[0].id });
  });
};

// VERSÃO OTIMIZADA PARA POSTGRES (Sem Loop!)
exports.atribuirParaTodosAlunos = (desafioId, callback) => {
  // Esse SQL insere na tabela aluno_desafios pegando TODOS os alunos da tabela usuarios de uma vez
  const sql = `
    INSERT INTO aluno_desafios (aluno_id, desafio_id, status)
    SELECT id, $1, 'pendente'
    FROM usuarios
    WHERE tipo = 'ALUNO'
    ON CONFLICT DO NOTHING; 
  `;
  // Nota: ON CONFLICT precisa de constraint, se der erro pode tirar essa linha final

  db.query(sql, [desafioId], (err, res) => {
    if (err) return callback(err);
    callback(null, { message: "Atribuído com sucesso", count: res.rowCount });
  });
};