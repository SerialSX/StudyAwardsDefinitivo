const { db } = require('../config/database.js');
const jwt = require('jsonwebtoken');

exports.getPontuacao = (req, res, next) => {
  const usuarioId = req.params.id;
  db.get(`SELECT nome, pontuacao_total FROM usuarios WHERE id = ?`, [usuarioId], (err, row) => {
    if (err) { return next(err); }
    else if (!row) { res.status(404).json({ erro: "Usuário não encontrado." }); }
    else { res.json({ id: usuarioId, nome: row.nome, pontuacao_total: row.pontuacao_total }); }
  });
};

exports.updatePontuacao = (req, res, next) => {
  const usuarioId = req.params.id;
  const { pontos } = req.body;
  if (typeof pontos !== 'number') {
    return res.status(400).json({ erro: "Campo 'pontos' deve ser um número." });
  }
  const query = `UPDATE usuarios SET pontuacao_total = pontuacao_total + ? WHERE id = ?`;
  db.run(query, [pontos, usuarioId], function (err) {
    if (err) { return next(err); }
    else if (this.changes === 0) { res.status(404).json({ erro: "Usuário não encontrado." }); }
    else { res.json({ mensagem: "Pontuação atualizada com sucesso!" }); }
  });
};

exports.cadastro = (req, res, next) => {
  const { nome, email, senha, tipo } = req.body;
  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
  }
  const sql = `INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`;
  db.run(sql, [nome, email, senha, tipo], function(err) {
    if (err) { return next(err); }
    res.status(201).json({
      id: this.lastID,
      nome: nome,
      email: email,
      tipo: tipo
    });
  });
};

exports.login = (req, res, next) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios." });
  }
  const sql = `SELECT * FROM usuarios WHERE email = ?`;
  db.get(sql, [email], (err, row) => {
    if (err) { return next(err); }
    if (!row) {
      return res.status(404).json({ erro: "Email não encontrado." });
    }
    if (row.senha !== senha) {
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    const payload = {
      id: row.id,
      nome: row.nome,
      tipo: row.tipo
    };

    const secret = "minha-senha-secreta-super-dificil"; 

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    res.json({
      message: "Login bem-sucedido!",
      token: token,
      usuario: {
        id: row.id,
        nome: row.nome,
        email: row.email,
        tipo: row.tipo,
        pontuacao_total: row.pontuacao_total
      }
    });
  });
};