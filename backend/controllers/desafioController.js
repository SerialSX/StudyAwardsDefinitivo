// backend/controllers/desafioController.js

const { db } = require('../config/database.js');

// Lógica para GET /api/desafios
exports.getDesafiosAluno = (req, res, next) => {
  const alunoId = req.query.alunoId;

  if (!alunoId) {
    return res.status(400).json({ erro: "ID do aluno é obrigatório (ex: /api/desafios?alunoId=1)" });
  }

  const sql = `
    SELECT 
      d.id, 
      d.titulo, 
      d.descricao, 
      d.pontos, 
      d.prazo_final,
      ad.status,
      ad.data_conclusao,
      ad.id as aluno_desafio_id
    FROM desafios d 
    JOIN aluno_desafios ad ON d.id = ad.desafio_id 
    WHERE ad.aluno_id = ?
  `;

  db.all(sql, [alunoId], (err, rows) => {
    if (err) { return next(err); }
    res.json({ desafios: rows });
  });
};

// Lógica para POST /api/desafios (Criar Desafio)
exports.criarDesafio = (req, res, next) => {
  // Pega os dados do corpo da requisição
  const { titulo, descricao, pontos, prazo_final } = req.body;

  // Pega o ID do professor logado (que o nosso middleware 'authMiddleware' colocou no 'req')
  const professorId = req.usuario.id; 

  if (!titulo || !pontos) {
    return res.status(400).json({ erro: "Título e pontos são obrigatórios." });
  }

  const sql = `
    INSERT INTO desafios (titulo, descricao, pontos, prazo_final, criado_por_professor_id) 
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [titulo, descricao, pontos, prazo_final, professorId], function(err) {
    if (err) { return next(err); } // Passa o erro para o errorHandler

    res.status(201).json({
      id: this.lastID,
      titulo: titulo,
      pontos: pontos,
      criado_por_professor_id: professorId
    });
  });
};