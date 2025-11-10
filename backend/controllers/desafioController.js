// backend/controllers/desafioController.js (Refatorado com Model)

const desafioModel = require('../models/desafioModel.js');

// GET /api/desafios
exports.getDesafiosAluno = (req, res, next) => {
  const alunoId = req.query.alunoId;
  if (!alunoId) {
    return res.status(400).json({ erro: "ID do aluno é obrigatório (ex: /api/desafios?alunoId=1)" });
  }

  desafioModel.findDesafiosByAlunoId(alunoId, (err, rows) => {
    if (err) { return next(err); }
    res.json({ desafios: rows });
  });
};

// POST /api/desafios
exports.criarDesafio = (req, res, next) => {
  const { titulo, descricao, pontos, prazo_final } = req.body;
  const professorId = req.usuario.id; 

  if (!titulo || !pontos) {
    return res.status(400).json({ erro: "Título e pontos são obrigatórios." });
  }

  desafioModel.createDesafio(titulo, descricao, pontos, prazo_final, professorId, (err, novoDesafio) => {
    if (err) { return next(err); }
    res.status(201).json({
      id: novoDesafio.id,
      titulo: titulo,
      pontos: pontos,
      criado_por_professor_id: professorId
    });
  });
};

// POST /api/desafios/atribuir-todos
exports.atribuirDesafioParaTodos = (req, res, next) => {
  const { desafio_id } = req.body;
  if (!desafio_id) {
    return res.status(400).json({ erro: "ID do desafio é obrigatório." });
  }

  desafioModel.atribuirParaTodosAlunos(desafio_id, (err, resultado) => {
    if (err) { return next(err); }
    if (resultado.total_alunos_atribuidos === 0) {
      return res.status(404).json({ erro: "Nenhum aluno encontrado para atribuir." });
    }
    res.status(201).json({ 
      message: `Desafio atribuído com sucesso.`,
      total_alunos_atribuidos: resultado.total_alunos_atribuidos
    });
  });
};

// POST /api/desafios/completar/:id
exports.completarDesafio = (req, res, next) => {
  const alunoDesafioId = req.params.id;
  const alunoId = req.usuario.id;

  desafioModel.findDesafioParaCompletar(alunoDesafioId, alunoId, (err, row) => {
    if (err) { return next(err); }
    if (!row) {
      return res.status(404).json({ erro: "Desafio não encontrado ou não pertence a este aluno." });
    }
    if (row.status !== 'pendente') {
      return res.status(400).json({ erro: `Este desafio já está com status: ${row.status}` });
    }

    const pontosGanhos = row.pontos;

    desafioModel.completarDesafioEAtualizarPontos(alunoDesafioId, alunoId, pontosGanhos, (err) => {
      if (err) { return next(err); }
      res.json({
        message: "Desafio concluído com sucesso!",
        pontosGanhos: pontosGanhos
      });
    });
  });
};