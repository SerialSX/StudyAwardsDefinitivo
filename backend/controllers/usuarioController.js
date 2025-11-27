// 1 - Importa o banco de dados (agora é o pool do Postgres)
const db = require('../config/database.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel.js');

exports.getPontuacao = (req, res, next) => {
  const usuarioId = req.params.id;
  
  // POSTGRES: Usa $1 em vez de ?
  const sql = `SELECT nome, pontuacao_total FROM usuarios WHERE id = $1`;
  
  db.query(sql, [usuarioId], (err, result) => {
    if (err) { return next(err); }
    
    // POSTGRES: O resultado vem em result.rows (array)
    if (result.rows.length === 0) { 
        res.status(404).json({ erro: "Usuário não encontrado." }); 
    } else { 
        const row = result.rows[0];
        res.json({ id: usuarioId, nome: row.nome, pontuacao_total: row.pontuacao_total }); 
    }
  });
};

exports.updatePontuacao = (req, res, next) => {
  const usuarioId = req.params.id;
  const { pontos } = req.body;
  
  if (typeof pontos !== 'number') {
    return res.status(400).json({ erro: "Campo 'pontos' deve ser um número." });
  }
  
  // POSTGRES: Usa $1, $2
  const query = `UPDATE usuarios SET pontuacao_total = pontuacao_total + $1 WHERE id = $2`;
  
  db.query(query, [pontos, usuarioId], (err, result) => {
    if (err) { return next(err); }
    
    // POSTGRES: result.rowCount diz quantas linhas mudaram
    if (result.rowCount === 0) { 
        res.status(404).json({ erro: "Usuário não encontrado." }); 
    } else { 
        res.json({ mensagem: "Pontuação atualizada com sucesso!" }); 
    }
  });
};

// --- FUNÇÃO DE CADASTRO (Usa o Model que já convertemos) ---
exports.cadastro = (req, res, next) => {
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
  }

  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) { return next(err); }
    
    // Chama o Model (que já está adaptado para Postgres)
    usuarioModel.createUser(nome, email, hash, tipo, idDoAlunoParaSalvar, (err, resultado) => {
      if (err) { 
          // POSTGRES: Código de erro para Unique Violation é '23505'
          if (err.code === '23505') {
              return res.status(400).json({ erro: "Este email já está cadastrado." });
          }
          return next(err); 
      }
      
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

// --- LOGIN (Adaptado para Postgres) ---
exports.login = (req, res, next) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios." });
  }
  
  // POSTGRES: $1
  const sql = `SELECT * FROM usuarios WHERE email = $1`;
  
  db.query(sql, [email], (err, result) => {
    if (err) { return next(err); }
    
    // POSTGRES: Checa se veio alguma linha
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Email não encontrado." });
    }

    const row = result.rows[0]; // Pega o primeiro usuário encontrado

    bcrypt.compare(senha, row.senha, (err, isMatch) => {
        if (err) { return next(err); }
        
        if (!isMatch) {
            return res.status(401).json({ erro: "Senha incorreta." });
        }

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