// ADICIONEI ESTA LINHA:
const { db } = require('../config/database.js');

exports.getDesafiosAluno = (req, res, next) => {
  const alunoId = req.query.alunoId;

  if (!alunoId) {
    return res.status(400).json({ erro: "ID do aluno é obrigatório" });
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
  // Pega o caminho do arquivo se ele foi enviado
  const comprovantePath = req.file ? req.file.path : null; 

  const sqlCheck = `
    SELECT ad.status 
    FROM aluno_desafios ad 
    WHERE ad.id = ? AND ad.aluno_id = ?
  `;

  db.get(sqlCheck, [alunoDesafioId, alunoId], (err, row) => {
    if (err) return next(err);
    if (!row) return res.status(404).json({ erro: "Desafio não encontrado." });
    
    if (row.status !== 'pendente') {
      return res.status(400).json({ erro: `Desafio já está com status: ${row.status}` });
    }

    // ATUALIZAÇÃO: Salva status 'em_analise' E o caminho da imagem
    const sqlUpdate = `
      UPDATE aluno_desafios 
      SET status = 'em_analise', data_conclusao = DATETIME('now'), comprovante_path = ? 
      WHERE id = ?
    `;

    db.run(sqlUpdate, [comprovantePath, alunoDesafioId], function(err) {
      if (err) return next(err);
      
      res.json({ 
        message: "Desafio enviado com comprovante! Aguarde a aprovação.",
        status: "em_analise",
        comprovante: comprovantePath
      });
    });
  });
};

// ATRIBUIR A TODOS (Lógica Recursiva para evitar travamento do banco)
exports.atribuirDesafioParaTodos = (req, res, next) => {
  const { desafio_id } = req.body;

  if (!desafio_id) {
    return res.status(400).json({ erro: "ID do desafio é obrigatório." });
  }

  const sqlFindAlunos = "SELECT id FROM usuarios WHERE tipo = 'ALUNO'";
  
  db.all(sqlFindAlunos, [], (err, alunos) => {
    if (err) { return next(err); }
    if (alunos.length === 0) {
      return res.status(404).json({ erro: "Nenhum aluno encontrado." });
    }

    const sqlInsert = `
      INSERT OR IGNORE INTO aluno_desafios (aluno_id, desafio_id, status) 
      VALUES (?, ?, 'pendente')
    `;

    let alunosAtribuidos = 0;

    db.run('BEGIN TRANSACTION', function(err) {
      if (err) { return next(err); }

      function inserirAluno(index) {
        if (index >= alunos.length) {
          db.run('COMMIT', function(err) {
            if (err) { return next(err); }
            res.status(201).json({ 
              message: `Desafio atribuído com sucesso.`,
              total_alunos_atribuidos: alunosAtribuidos
            });
          });
          return;
        }

        const aluno = alunos[index];
        db.run(sqlInsert, [aluno.id, desafio_id], function(err) {
          if (err) {
             return db.run('ROLLBACK', () => next(err));
          }
          if (this.changes > 0) {
            alunosAtribuidos++;
          }
          inserirAluno(index + 1);
        });
      }
      inserirAluno(0);
    });
  });
};