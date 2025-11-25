const penalidadeModel = require('../models/penalidadeModel.js');
const usuarioModel = require('../models/usuarioModel.js');

// 1. Lógica para GET /alunos/:id/penalidades
exports.getPenalidades = (req, res, next) => {
  const alunoId = req.params.id;

  penalidadeModel.findPenalidadesByAlunoId(alunoId, (err, rows) => {
    if (err) { return next(err); }
    res.json({ historico: rows });
  });
};

// 2. Lógica para POST /registrar-falta
exports.registrarFalta = (req, res, next) => {
  const { alunoId, dataFalta, professorId, pontosDeduzidos, motivo } = req.body;
  const dataAtual = new Date().toISOString();

  penalidadeModel.registrarFrequencia(alunoId, dataFalta, professorId, (err) => {
    if (err) { return next(err); }

    penalidadeModel.registrarPenalidade(alunoId, motivo, pontosDeduzidos, dataAtual, (err) => {
      if (err) { return next(err); }

      usuarioModel.updatePontuacaoById(alunoId, -pontosDeduzidos, (err, changes) => {
        if (err) { return next(err); }
        res.status(201).json({ message: "Falta e penalidade registradas com sucesso!" });
      });
    });
  });
};

// 3. Lógica para GET /verificar-atrasos
exports.verificarAtrasos = (req, res, next) => {

  penalidadeModel.findTarefasAtrasadas((err, rows) => {
    if (err) { return next(err); }
    if (rows.length === 0) {
      return res.json({ message: "Nenhuma tarefa atrasada encontrada." });
    }

    let tarefasProcessadas = 0;
    rows.forEach(tarefa => {
      const pontosDeduzidos = 20;
      const motivo = `Atraso na entrega do desafio: ${tarefa.desafio_titulo}`;
      const dataAtual = new Date().toISOString();

      penalidadeModel.aplicarPenalidadeAtraso(tarefa.aluno_id, motivo, pontosDeduzidos, dataAtual, tarefa.aluno_desafio_id, (err) => {
        if (err) {
          console.error(`Erro ao aplicar penalidade para aluno ${tarefa.aluno_id}: ${err.message}`);
        }
        tarefasProcessadas++;
        if (tarefasProcessadas === rows.length) {
          res.json({ message: `Verificação concluída. ${rows.length} penalidade(s) aplicada(s).` });
        }
      });
    });
  });
};