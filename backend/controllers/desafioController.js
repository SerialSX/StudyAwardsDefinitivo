const { db } = require('../config/database.js');

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

exports.criarDesafio = (req, res, next) => {
  const { titulo, descricao, pontos, prazo_final } = req.body;

  const professorId = req.usuario.id; 

  if (!titulo || !pontos) {
    return res.status(400).json({ erro: "Título e pontos são obrigatórios." });
  }

  const sql = `
    INSERT INTO desafios (titulo, descricao, pontos, prazo_final, criado_por_professor_id) 
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [titulo, descricao, pontos, prazo_final, professorId], function(err) {
    if (err) { return next(err); }

    res.status(201).json({
      id: this.lastID,
      titulo: titulo,
      pontos: pontos,
      criado_por_professor_id: professorId
    });
  });
};

exports.completarDesafio = (req, res, next) => {
  const alunoDesafioId = req.params.id;
  const alunoId = req.usuario.id;
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

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const sqlUpdateStatus = `
        UPDATE aluno_desafios 
        SET status = 'concluido', data_conclusao = DATETIME('now') 
        WHERE id = ?
      `;
      db.run(sqlUpdateStatus, [alunoDesafioId], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return next(err);
        }

        const sqlUpdatePontos = `
          UPDATE usuarios 
          SET pontuacao_total = pontuacao_total + ? 
          WHERE id = ?
        `;
        db.run(sqlUpdatePontos, [pontosGanhos, alunoId], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return next(err);
          }

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


exports.atribuirDesafioParaTodos = (req, res, next) => {
  const { desafio_id } = req.body;
  const professorId = req.usuario.id; //

  if (!desafio_id) {
    return res.status(400).json({ erro: "ID do desafio é obrigatório." });
  }
  // Busca o ID de todos os alunos
  const sqlFindAlunos = "SELECT id FROM usuarios WHERE tipo = 'ALUNO'";
  
  db.all(sqlFindAlunos, [], (err, alunos) => {
    if (err) { return next(err); }
    if (alunos.length === 0) {
      return res.status(404).json({ erro: "Nenhum aluno encontrado para atribuir." });
    }

    const sqlInsert = `
      INSERT OR IGNORE INTO aluno_desafios (aluno_id, desafio_id, status) 
      VALUES (?, ?, 'pendente')
    `;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let alunosAtribuidos = 0;
      alunos.forEach(aluno => {
        db.run(sqlInsert, [aluno.id, desafio_id], function(err) {
          if (err) {
            console.error('Erro ao atribuir desafio:', err);
          } else if (this.changes > 0) {
            alunosAtribuidos++;
          }
        });
      });

      db.run('COMMIT', (err) => {
        if (err) { return next(err); }
        res.status(201).json({ 
          message: `Desafio atribuído com sucesso.`,
          total_alunos_atribuidos: alunosAtribuidos
        });
      });
    });
  });
};