const { db } = require('../config/database.js');

exports.getPenalidades = (req, res, next) => {
  const alunoId = req.params.id;
  const sql = "SELECT motivo, pontos_deduzidos, data FROM penalidades WHERE aluno_id = ?";
  db.all(sql, [alunoId], (err, rows) => {
    if (err) { return next(err); }
    res.json({ historico: rows });
  });
};

exports.registrarFalta = (req, res, next) => {
  const { alunoId, dataFalta, professorId, pontosDeduzidos, motivo } = req.body;
  const dataAtual = new Date().toISOString();
  const sqlFrequencia = `INSERT INTO frequencia (aluno_id, data_falta, registrado_por_professor_id) VALUES (?, ?, ?)`;

  db.run(sqlFrequencia, [alunoId, dataFalta, professorId], function (err) {
    if (err) { return next(err); }

    const sqlPenalidade = `INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES (?, ?, ?, ?)`;
    db.run(sqlPenalidade, [alunoId, motivo, pontosDeduzidos, dataAtual], function (err) {
      if (err) { return res.status(500).json({ error: `Erro ao criar penalidade: ${err.message}` }); }

      const sqlPontuacao = `UPDATE usuarios SET pontuacao_total = pontuacao_total - ? WHERE id = ?`;
      db.run(sqlPontuacao, [pontosDeduzidos, alunoId], function(err) {
        if (err) { return res.status(500).json({ error: `Erro ao atualizar pontuação: ${err.message}`}); }
        res.status(201).json({ message: "Falta e penalidade registradas com sucesso!" });
      });
    });
  });
};

exports.verificarAtrasos = (req, res, next) => {
  const sqlBuscaAtrasos = `
      SELECT 
          ad.id as aluno_desafio_id,
          ad.aluno_id,
          d.titulo as desafio_titulo
      FROM aluno_desafios ad
      JOIN desafios d ON ad.desafio_id = d.id
      WHERE ad.status = 'pendente' AND d.prazo_final < DATE('now')
  `;
  db.all(sqlBuscaAtrasos, [], (err, rows) => {
    if (err) { return next(err); }
    if (rows.length === 0) { return res.json({ message: "Nenhuma tarefa atrasada encontrada." }); }

    rows.forEach(tarefa => {
        const pontosDeduzidos = 20;
        const motivo = `Atraso na entrega do desafio: ${tarefa.desafio_titulo}`;
        const dataAtual = new Date().toISOString();
        db.serialize(() => {
            db.run(`INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES (?, ?, ?, ?)`, [tarefa.aluno_id, motivo, pontosDeduzidos, dataAtual]);
            db.run(`UPDATE usuarios SET pontuacao_total = pontuacao_total - ? WHERE id = ?`, [pontosDeduzidos, tarefa.aluno_id]);
            db.run(`UPDATE aluno_desafios SET status = 'atrasado' WHERE id = ?`, [tarefa.aluno_desafio_id]);
        });
    });
    res.json({ message: `Verificação concluída. ${rows.length} penalidade(s) aplicada(s).` });
  });
};