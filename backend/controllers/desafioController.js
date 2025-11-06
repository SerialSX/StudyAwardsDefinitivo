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

// Lógica para POST /api/desafios/completar/:id (Concluir Desafio)
// :id aqui será o 'aluno_desafio_id'
exports.completarDesafio = (req, res, next) => {
  const alunoDesafioId = req.params.id;
  const alunoId = req.usuario.id; // Pega o ID do aluno logado (do token)

  // 1. Primeiro, buscar o desafio para saber quantos pontos ele vale
  //    e garantir que pertence ao aluno logado e está pendente
  const sqlGetDesafio = `
    SELECT 
      ad.status, 
      d.pontos,
      d.id as desafio_id
    FROM aluno_desafios ad
    JOIN desafios d ON ad.desafio_id = d.id
    WHERE ad.id = ? AND ad.aluno_id = ?
  `;

  db.get(sqlGetDesafio, [alunoDesafioId, alunoId], (err, row) => {
    if (err) { return next(err); }
    if (!row) {
      return res.status(404).json({ erro: "Desafio não encontrado ou não pertence a este aluno." });
    }
    if (row.status !== 'pendente') {
      return res.status(400).json({ erro: `Este desafio já está com status: ${row.status}` });
    }

    const pontosGanhos = row.pontos;

    // 2. Se tudo estiver OK, atualizar o status e os pontos (em uma transação)
    db.serialize(() => {
      // Começa a "transação"
      db.run('BEGIN TRANSACTION');

      // Atualiza o status do desafio
      const sqlUpdateStatus = `
        UPDATE aluno_desafios 
        SET status = 'concluido', data_conclusao = DATETIME('now') 
        WHERE id = ?
      `;
      db.run(sqlUpdateStatus, [alunoDesafioId], function(err) {
        if (err) {
          db.run('ROLLBACK'); // Desfaz a transação
          return next(err);
        }

        // Adiciona os pontos ao aluno
        const sqlUpdatePontos = `
          UPDATE usuarios 
          SET pontuacao_total = pontuacao_total + ? 
          WHERE id = ?
        `;
        db.run(sqlUpdatePontos, [pontosGanhos, alunoId], function(err) {
          if (err) {
            db.run('ROLLBACK'); // Desfaz a transação
            return next(err);
          }

          // Se tudo deu certo, confirma a transação
          db.run('COMMIT');
          res.json({
            message: "Desafio concluído com sucesso!",
            pontosGanhos: pontosGanhos
          });
        });
      });
    });
  });
};