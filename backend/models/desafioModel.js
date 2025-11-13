const { db } = require('../config/database.js');

// Model para GET /api/desafios (Listar desafios de um aluno)
exports.findDesafiosByAlunoId = (alunoId, callback) => {
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
    callback(err, rows);
  });
};

// Model para POST /api/desafios (Criar um novo desafio)
exports.createDesafio = (titulo, descricao, pontos, prazo_final, professorId, callback) => {
  const sql = `
    INSERT INTO desafios (titulo, descricao, pontos, prazo_final, criado_por_professor_id) 
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(sql, [titulo, descricao, pontos, prazo_final, professorId], function(err) {
    if (err) { return callback(err); }
    callback(null, { id: this.lastID }); // Retorna o ID do novo desafio
  });
};

// Model para POST /api/desafios/atribuir-todos
exports.atribuirParaTodosAlunos = (desafio_id, callback) => {
  const sqlFindAlunos = "SELECT id FROM usuarios WHERE tipo = 'ALUNO'";

  db.all(sqlFindAlunos, [], (err, alunos) => {
    if (err) { return callback(err); }
    if (alunos.length === 0) {
      return callback(null, { total_alunos_atribuidos: 0 });
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
        if (err) { return callback(err); }
        callback(null, { total_alunos_atribuidos: alunosAtribuidos });
      });
    });
  });
};

// Model para POST /api/desafios/completar/:id (Parte 1: Buscar)
exports.findDesafioParaCompletar = (alunoDesafioId, alunoId, callback) => {
  const sql = `
    SELECT 
      ad.status, 
      d.pontos
    FROM aluno_desafios ad
    JOIN desafios d ON ad.desafio_id = d.id
    WHERE ad.id = ? AND ad.aluno_id = ?
  `;
  db.get(sql, [alunoDesafioId, alunoId], (err, row) => {
    callback(err, row);
  });
};

// Model para POST /api/desafios/completar/:id (Parte 2: Executar)
exports.completarDesafioEAtualizarPontos = (alunoDesafioId, alunoId, pontosGanhos, callback) => {
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
        return callback(err);
      }

      const sqlUpdatePontos = `
        UPDATE usuarios 
        SET pontuacao_total = pontuacao_total + ? 
        WHERE id = ?
      `;
      db.run(sqlUpdatePontos, [pontosGanhos, alunoId], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return callback(err);
        }
        db.run('COMMIT', callback);
      });
    });
  });
};