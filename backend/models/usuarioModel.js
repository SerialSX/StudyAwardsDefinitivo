const { db } = require('../config/database.js');

exports.findUserByEmail = (email, callback) => {
  const sql = `SELECT * FROM usuarios WHERE email = ?`;
  db.get(sql, [email], (err, row) => {
    callback(err, row);
  });
};

// --- Adicionado alunoAssociadoId nos parâmetros ---
exports.createUser = (nome, email, hash, tipo, alunoAssociadoId, callback) => {
  const sql = `INSERT INTO usuarios (nome, email, senha, tipo, aluno_associado_id) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [nome, email, hash, tipo, alunoAssociadoId], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, { id: this.lastID });
  });
};

exports.findPontuacaoById = (id, callback) => {
  const sql = `SELECT nome, pontuacao_total FROM usuarios WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    callback(err, row);
  });
};

exports.updatePontuacaoById = (id, pontos, callback) => {
  const sql = `UPDATE usuarios SET pontuacao_total = pontuacao_total + ? WHERE id = ?`;
  db.run(sql, [pontos, id], function(err) {
    callback(err, this.changes);
  });
};