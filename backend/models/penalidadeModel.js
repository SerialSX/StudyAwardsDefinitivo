const { db } = require('../config/database.js');

exports.findPenalidadesByAlunoId = (alunoId, callback) => {
  const sql = "SELECT motivo, pontos_deduzidos, data FROM penalidades WHERE aluno_id = ?";
  db.all(sql, [alunoId], (err, rows) => {
    callback(err, rows);
  });
};

exports.registrarFrequencia = (alunoId, dataFalta, professorId, callback) => {
  const sql = `INSERT INTO frequencia (aluno_id, data_falta, registrado_por_professor_id) VALUES (?, ?, ?)`;
  db.run(sql, [alunoId, dataFalta, professorId], function(err) {
    callback(err);
  });
};

exports.registrarPenalidade = (alunoId, motivo, pontosDeduzidos, data, callback) => {
  const sql = `INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES (?, ?, ?, ?)`;
  db.run(sql, [alunoId, motivo, pontosDeduzidos, data], function(err) {
    callback(err);
  });
};

exports.findTarefasAtrasadas = (callback) => {
  const sql = `
    SELECT 
        ad.id as aluno_desafio_id,
        ad.aluno_id,
        d.titulo as desafio_titulo
    FROM aluno_desafios ad
    JOIN desafios d ON ad.desafio_id = d.id
    WHERE ad.status = 'pendente' AND d.prazo_final < DATE('now')
  `;
  db.all(sql, [], (err, rows) => {
    callback(err, rows);
  });
};

exports.aplicarPenalidadeAtraso = (aluno_id, motivo, pontosDeduzidos, data, aluno_desafio_id, callback) => {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES (?, ?, ?, ?)`, [aluno_id, motivo, pontosDeduzidos, data]);
        db.run(`UPDATE usuarios SET pontuacao_total = pontuacao_total - ? WHERE id = ?`, [pontosDeduzidos, aluno_id]);
        db.run(`UPDATE aluno_desafios SET status = 'atrasado' WHERE id = ?`, [aluno_desafio_id]);
        db.run('COMMIT', (err) => {
            callback(err);
        });
    });
};