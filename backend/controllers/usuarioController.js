// 1. IMPORTANTE: Importa o banco de dados
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

// --- FUNÇÃO DE CADASTRO ATUALIZADA (Com vínculo de Responsável) ---
exports.cadastro = (req, res, next) => {
  const { nome, email, senha, tipo, alunoId } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: "Todos os campos obrigatórios são necessários." });
  }

  if (senha.length < 6) {
    return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres." });
  }

  if (tipo === 'PROFESSOR') {
      const CODIGO_SECRETO = "ADMIN123";
      const { codigoProfessor } = req.body;

      if (!codigoProfessor || codigoProfessor !== CODIGO_SECRETO) {
          return res.status(403).json({ erro: "Código de verificação de professor inválido ou ausente." });
      }
  }

  if (tipo === 'RESPONSAVEL' && !alunoId) {
    return res.status(400).json({ erro: "Para cadastrar como Responsável, informe o ID ou Matrícula do Aluno." });
  }

  const idDoAluno = (tipo === 'RESPONSAVEL') ? alunoId : null;

  const sql = `INSERT INTO usuarios (nome, email, senha, tipo, aluno_associado_id) VALUES (?, ?, ?, ?, ?)`;

  db.run(sql, [nome, email, senha, tipo, idDoAluno], function(err) {
    if (err) { 
        // Verifica erro de email duplicado
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ erro: "Este email já está cadastrado." });
        }
        return next(err); 
    }
    
    res.status(201).json({
      id: this.lastID,
      nome: nome,
      email: email,
      tipo: tipo,
      aluno_associado_id: idDoAluno
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

    // Payload do token agora inclui o ID do aluno associado (se for responsável)
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
};