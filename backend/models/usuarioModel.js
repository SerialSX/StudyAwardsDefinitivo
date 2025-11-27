const db = require('../config/database.js');

exports.findUserByEmail = (email, callback) => {
  // Postgres usa $1, $2... em vez de ?
  const sql = `SELECT * FROM usuarios WHERE email = $1`;
  db.query(sql, [email], (err, res) => {
    // Postgres retorna as linhas dentro de res.rows
    if (err) return callback(err);
    callback(null, res.rows[0]);
  });
};

exports.createUser = (nome, email, hash, tipo, alunoId, callback) => {
  // Precisa do RETURNING id para saber qual ID foi gerado
  const sql = `
    INSERT INTO usuarios (nome, email, senha, tipo, aluno_associado_id) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING id
  `;
  db.query(sql, [nome, email, hash, tipo, alunoId], (err, res) => {
    if (err) return callback(err);
    callback(null, { id: res.rows[0].id });
  });
};

exports.findPontuacaoById = (id, callback) => {
  const sql = `SELECT nome, pontuacao_total FROM usuarios WHERE id = $1`;
  db.query(sql, [id], (err, res) => {
    if (err) return callback(err);
    callback(null, res.rows[0]);
  });
};

exports.updatePontuacaoById = (id, pontos, callback) => {
  const sql = `UPDATE usuarios SET pontuacao_total = pontuacao_total + $1 WHERE id = $2`;
  db.query(sql, [pontos, id], (err, res) => {
    if (err) return callback(err);
    callback(null, res.rowCount);
  });
};