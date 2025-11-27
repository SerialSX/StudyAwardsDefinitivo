// Importa o "db" para queries normais e o "pool" para transações
const db = require('../config/database.js');
const { pool } = require('../config/database.js');
const desafioModel = require('../models/desafioModel.js'); // Vamos usar o model para a atribuição em massa

exports.getDesafiosAluno = (req, res, next) => {
  const alunoId = req.query.alunoId;

  if (!alunoId) {
    return res.status(400).json({ erro: "ID do aluno é obrigatório" });
  }

  const sql = `
    SELECT 
      d.id, d.titulo, d.descricao, d.pontos, d.prazo_final,
      ad.status, ad.data_conclusao, ad.id as aluno_desafio_id
    FROM desafios d 
    JOIN aluno_desafios ad ON d.id = ad.desafio_id 
    WHERE ad.aluno_id = $1
  `;

  db.query(sql, [alunoId], (err, result) => {
    if (err) { return next(err); }
    res.json({ desafios: result.rows });
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
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING id
  `;

  db.query(sql, [titulo, descricao, pontos, prazo_final, professorId], (err, result) => {
    if (err) { return next(err); }

    res.status(201).json({
      id: result.rows[0].id,
      titulo: titulo,
      pontos: pontos,
      criado_por_professor_id: professorId
    });
  });
};

exports.completarDesafio = (req, res, next) => {
  const alunoDesafioId = req.params.id;
  const alunoId = req.usuario.id;
  const comprovantePath = req.file ? req.file.path : null; 

  const sqlCheck = `
    SELECT status 
    FROM aluno_desafios 
    WHERE id = $1 AND aluno_id = $2
  `;

  db.query(sqlCheck, [alunoDesafioId, alunoId], (err, result) => {
    if (err) return next(err);
    if (result.rows.length === 0) return res.status(404).json({ erro: "Desafio não encontrado." });
    
    const row = result.rows[0];
    if (row.status !== 'pendente') {
      return res.status(400).json({ erro: `Desafio já está com status: ${row.status}` });
    }

    // Postgres usa CURRENT_TIMESTAMP em vez de DATETIME('now')
    const sqlUpdate = `
      UPDATE aluno_desafios 
      SET status = 'em_analise', data_conclusao = CURRENT_TIMESTAMP, comprovante_path = $1 
      WHERE id = $2
    `;

    db.query(sqlUpdate, [comprovantePath, alunoDesafioId], (err, result) => {
      if (err) return next(err);
      
      res.json({ 
        message: "Desafio enviado com comprovante! Aguarde a aprovação.",
        status: "em_analise",
        comprovante: comprovantePath
      });
    });
  });
};

// ATRIBUIR A TODOS (Versão Otimizada para Postgres)
// Aqui usamos o Model que tem aquele SQL inteligente "INSERT INTO ... SELECT"
exports.atribuirDesafioParaTodos = (req, res, next) => {
  const { desafio_id } = req.body;

  if (!desafio_id) {
    return res.status(400).json({ erro: "ID do desafio é obrigatório." });
  }

  desafioModel.atribuirParaTodosAlunos(desafio_id, (err, result) => {
      if (err) return next(err);
      res.status(201).json({ 
          message: `Desafio atribuído com sucesso.`,
          total_alunos_atribuidos: result ? result.count : 'Vários'
      });
  });
};

exports.listarEntregasPendentes = (req, res, next) => {
  const sql = `
    SELECT 
      ad.id as aluno_desafio_id,
      u.nome as nome_aluno,
      d.titulo as titulo_desafio,
      d.pontos,
      ad.comprovante_path
    FROM aluno_desafios ad
    JOIN usuarios u ON ad.aluno_id = u.id
    JOIN desafios d ON ad.desafio_id = d.id
    WHERE ad.status = 'em_analise'
  `;

  db.query(sql, [], (err, result) => {
    if (err) return next(err);
    res.json({ entregas: result.rows });
  });
};

// AVALIAR ENTREGA (Transação Complexa com Pool)
exports.avaliarEntrega = async (req, res, next) => {
  const { id } = req.params;
  const { aprovado } = req.body;

  const novoStatus = aprovado ? 'concluido' : 'pendente'; 

  // Precisamos de um cliente exclusivo para fazer transação
  const client = await pool.connect();

  try {
      // 1. Verifica se existe
      const checkRes = await client.query(`SELECT aluno_id, desafio_id FROM aluno_desafios WHERE id = $1`, [id]);
      if (checkRes.rows.length === 0) {
          client.release();
          return res.status(404).json({ erro: "Entrega não encontrada" });
      }
      const row = checkRes.rows[0];

      // Se for rejeitar, é simples (não precisa de transação complexa, mas vamos manter a consistência)
      if (!aprovado) {
          await client.query(`UPDATE aluno_desafios SET status = $1, comprovante_path = NULL WHERE id = $2`, [novoStatus, id]);
          client.release();
          return res.json({ message: "Rejeitado. O aluno terá que enviar de novo." });
      }

      // Se for APROVAR, precisa dar pontos (Transação)
      await client.query('BEGIN'); // Inicia

      // Busca quantos pontos vale
      const desafioRes = await client.query(`SELECT pontos FROM desafios WHERE id = $1`, [row.desafio_id]);
      const pontos = desafioRes.rows[0].pontos;

      // Atualiza status do desafio
      await client.query(`UPDATE aluno_desafios SET status = $1 WHERE id = $2`, [novoStatus, id]);

      // Atualiza pontos do aluno
      await client.query(`UPDATE usuarios SET pontuacao_total = pontuacao_total + $1 WHERE id = $2`, [pontos, row.aluno_id]);

      await client.query('COMMIT'); // Salva tudo
      res.json({ message: "Aprovado com sucesso!" });

  } catch (err) {
      await client.query('ROLLBACK'); // Desfaz se deu erro
      next(err);
  } finally {
      client.release(); // Libera a conexão
  }
};