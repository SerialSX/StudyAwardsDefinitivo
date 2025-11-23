// 1. IMPORTANTE: Importa o banco de dados
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

// --- FUNÇÃO DE CADASTRO ATUALIZADA (Com vínculo de Responsável) ---
exports.cadastro = (req, res, next) => {
  const { nome, email, senha, tipo, alunoAssociadoId, codigoProfessor } = req.body; // Adicionei codigoProfessor aqui

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: "Todos os campos obrigatórios são necessários." });
  }

  // --- 1. SEGURANÇA: Senha Mínima ---
  if (senha.length < 6) {
    return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres." });
  }

  // --- 2. SEGURANÇA: Validação de Professor ---
  if (tipo === 'PROFESSOR') {
      const CODIGO_SECRETO = "ADMIN123"; // Defina a senha da escola aqui
      if (!codigoProfessor || codigoProfessor !== CODIGO_SECRETO) {
          return res.status(403).json({ erro: "Código da instituição inválido. Você não tem permissão para criar conta de Professor." });
      }
  }

  // Lógica do Responsável (Mantendo o trabalho dos seus colegas)
  let idDoAluno = null;
  if (tipo === 'RESPONSAVEL') {
    if (!alunoAssociadoId) {
        // Se quiser tornar obrigatório vincular agora, descomente a linha abaixo
        // return res.status(400).json({ erro: "Responsável deve vincular um ID de aluno." });
    }
    idDoAluno = alunoAssociadoId;
  }

  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) { return next(err); }
    
    // Chama o model (que seus colegas atualizaram para aceitar 5 argumentos)
    usuarioModel.createUser(nome, email, hash, tipo, idDoAluno, (err, resultado) => {
      if (err) { 
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ erro: "Este email já está cadastrado." });
          }
          return next(err); 
      }
      
      res.status(201).json({
        id: resultado.id, // O model retorna { id: this.lastID }
        nome: nome,
        email: email,
        tipo: tipo,
        aluno_associado_id: idDoAluno
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

console.log("Senha digitada:", senha);
    console.log("Hash no banco:", row.senha);

    bcrypt.compare(senha, row.senha, (err, isMatch) => {
        if (err) { return next(err); }
        
        // --- O VEREDITO REAL ---
        console.log("A SENHA BATEU?", isMatch); // Se der TRUE, está tudo perfeito
        
        if (!isMatch) {
            return res.status(401).json({ erro: "Senha incorreta." });
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