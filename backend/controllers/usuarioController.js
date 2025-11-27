// 1 - Importa o banco de dados
const { db } = require('../config/database.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel.js');

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

// --- FUNÇÃO DE CADASTRO ATUALIZADA ---
exports.cadastro = (req, res, next) => {
  console.log("📩 CADASTRO RECEBIDO:", req.body); // <--- VAI MOSTRAR O QUE O FRONT MANDOU

  const { nome, email, senha, tipo, alunoId, codigoProfessor } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: "Todos os campos obrigatórios são necessários." });
  }

  if (senha.length < 6) {
    return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres." });
  }

  if (tipo === 'PROFESSOR') {
      const CODIGO_SECRETO = "ADMIN123"; 
      if (!codigoProfessor || codigoProfessor !== CODIGO_SECRETO) {
          return res.status(403).json({ erro: "Código da instituição inválido." });
      }
  }

  let idDoAlunoParaSalvar = null;
  if (tipo === 'RESPONSAVEL') {
    idDoAlunoParaSalvar = alunoId; 
    console.log("👨‍👧 TIPO RESPONSÁVEL DETECTADO. ID ALUNO:", idDoAlunoParaSalvar); // <--- VERIFICAÇÃO
  }

  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) { return next(err); }
    
    usuarioModel.createUser(nome, email, hash, tipo, idDoAlunoParaSalvar, (err, resultado) => {
      if (err) { 
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ erro: "Este email já está cadastrado." });
          }
          return next(err); 
      }
      
      console.log("✅ USUÁRIO CRIADO NO BANCO COM ID:", resultado.id); // <--- SUCESSO
      
      res.status(201).json({
        id: resultado.id,
        nome: nome,
        email: email,
        tipo: tipo,
        aluno_associado_id: idDoAlunoParaSalvar
      });
    });
  });
};

exports.login = (req, res, next) => {
  const { email, senha } = req.body;
  
  const sql = `SELECT * FROM usuarios WHERE email = ?`;
  
  db.get(sql, [email], (err, row) => {
    if (err) { return next(err); }
    if (!row) { return res.status(404).json({ erro: "Email não encontrado." }); }

    bcrypt.compare(senha, row.senha, (err, isMatch) => {
        if (err) { return next(err); }
        if (!isMatch) { return res.status(401).json({ erro: "Senha incorreta." }); }

        console.log("🔑 LOGIN REALIZADO. DADOS DO BANCO:", row); // <--- VAI MOSTRAR SE O ID ESTÁ NO BANCO

        const payload = {
            id: row.id,
            nome: row.nome,
            tipo: row.tipo,
            alunoIdAssociado: row.aluno_associado_id 
        };

        const secret = "minha-senha-secreta-super-dificil"; 
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        res.json({
            message: "Login bem-sucedido!",
            token: token,
            usuario: payload 
        });
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

    bcrypt.compare(senha, row.senha, (err, isMatch) => {
        if (err) { return next(err); }
        
        if (!isMatch) {
            return res.status(401).json({ erro: "Senha incorreta." });
        }

        // --- O PULO DO GATO ESTÁ AQUI ---
            const payload = {
            id: row.id,
            nome: row.nome,
            tipo: row.tipo,
            alunoIdAssociado: row.aluno_associado_id // <--- ESSA LINHA É OBRIGATÓRIA
        };

        const secret = "minha-senha-secreta-super-dificil"; 
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        res.json({
            message: "Login bem-sucedido!",
            token: token,
            usuario: payload // O frontend vai salvar isso no localStorage
        });
    });
  });
};