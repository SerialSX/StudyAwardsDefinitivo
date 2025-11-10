// backend/controllers/usuarioController.js (Refatorado com Model)

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// 1. Importa o MODELO em vez do banco
const usuarioModel = require('../models/usuarioModel.js');

// --- Lógica de Pontuação ---

exports.getPontuacao = (req, res, next) => {
  const usuarioId = req.params.id;

  // 2. Chama o MODEL
  usuarioModel.findPontuacaoById(usuarioId, (err, row) => {
    if (err) { return next(err); }
    if (!row) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }
    res.json({ id: usuarioId, nome: row.nome, pontuacao_total: row.pontuacao_total });
  });
};

exports.updatePontuacao = (req, res, next) => {
  const usuarioId = req.params.id;
  const { pontos } = req.body;

  if (typeof pontos !== 'number') {
    return res.status(400).json({ erro: "Campo 'pontos' deve ser um número." });
  }

  // 3. Chama o MODEL
  usuarioModel.updatePontuacaoById(usuarioId, pontos, (err, changes) => {
    if (err) { return next(err); }
    if (changes === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }
    res.json({ mensagem: "Pontuação atualizada com sucesso!" });
  });
};

// --- Lógica de Cadastro e Login ---

exports.cadastro = (req, res, next) => {
  const { nome, email, senha, tipo } = req.body;
  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
  }

  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) { return next(err); }

    // 4. Chama o MODEL
    usuarioModel.createUser(nome, email, hash, tipo, (err, novoUsuario) => {
      if (err) { return next(err); } // Erro (ex: email duplicado)

      res.status(201).json({
        id: novoUsuario.id,
        nome: nome,
        email: email,
        tipo: tipo
      });
    });
  });
};

exports.login = (req, res, next) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios." });
  }

  // 5. Chama o MODEL
  usuarioModel.findUserByEmail(email, (err, row) => {
    if (err) { return next(err); }
    if (!row) {
      return res.status(404).json({ erro: "Email não encontrado." });
    }

    bcrypt.compare(senha, row.senha, (err, isMatch) => {
      if (err) { return next(err); }
      if (!isMatch) {
        return res.status(401).json({ erro: "Senha incorreta." });
      }

      // A senha bateu! Gerar o token
      const payload = { id: row.id, nome: row.nome, tipo: row.tipo };
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
  });
};