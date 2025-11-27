const db = require('../config/database.js');
const { pool } = require('../config/database.js'); // Precisamos do pool para transações

exports.findPenalidadesByAlunoId = (alunoId, callback) => {
  const sql = "SELECT motivo, pontos_deduzidos, data FROM penalidades WHERE aluno_id = $1";
  db.query(sql, [alunoId], (err, res) => {
    if (err) return callback(err, null);
    callback(null, res.rows);
  });
};

exports.registrarFrequencia = (alunoId, dataFalta, professorId, callback) => {
  const sql = `INSERT INTO frequencia (aluno_id, data_falta, registrado_por_professor_id) VALUES ($1, $2, $3)`;
  db.query(sql, [alunoId, dataFalta, professorId], (err, res) => {
    callback(err);
  });
};

exports.registrarPenalidade = (alunoId, motivo, pontosDeduzidos, data, callback) => {
  const sql = `INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES ($1, $2, $3, $4)`;
  db.query(sql, [alunoId, motivo, pontosDeduzidos, data], (err, res) => {
    callback(err);
  });
};

exports.findTarefasAtrasadas = (callback) => {
  // ATENÇÃO: Postgres usa CURRENT_DATE em vez de DATE('now')
  const sql = `
    SELECT 
        ad.id as aluno_desafio_id,
        ad.aluno_id,
        d.titulo as desafio_titulo
    FROM aluno_desafios ad
    JOIN desafios d ON ad.desafio_id = d.id
    WHERE ad.status = 'pendente' AND CAST(d.prazo_final AS DATE) < CURRENT_DATE
  `;
  
  db.query(sql, [], (err, res) => {
    if (err) return callback(err, null);
    callback(null, res.rows);
  });
};

// Transação complexa convertida para Postgres (Async/Await para facilitar)
exports.aplicarPenalidadeAtraso = async (aluno_id, motivo, pontosDeduzidos, data, aluno_desafio_id, callback) => {
    const client = await pool.connect(); // Pega um cliente exclusivo
    
    try {
        await client.query('BEGIN'); // Inicia transação

        // 1. Cria penalidade
        await client.query(
            `INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES ($1, $2, $3, $4)`, 
            [aluno_id, motivo, pontosDeduzidos, data]
        );

        // 2. Tira pontos
        await client.query(
            `UPDATE usuarios SET pontuacao_total = pontuacao_total - $1 WHERE id = $2`, 
            [pontosDeduzidos, aluno_id]
        );

        // 3. Muda status para atrasado
        await client.query(
            `UPDATE aluno_desafios SET status = 'atrasado' WHERE id = $1`, 
            [aluno_desafio_id]
        );

        await client.query('COMMIT'); // Salva tudo
        callback(null); // Sucesso
    } catch (e) {
        await client.query('ROLLBACK'); // Desfaz se der erro
        callback(e);
    } finally {
        client.release(); // Solta o cliente
    }
};