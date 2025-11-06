// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const secret = "minha-senha-secreta-super-dificil"; // A mesma senha secreta

// Middleware de Autenticação
const authMiddleware = (req, res, next) => {
  // 1. Pega o token do cabeçalho "Authorization"
  // O frontend vai enviar assim: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Acesso negado. Nenhum token fornecido.' });
  }

  const token = authHeader.split(' ')[1]; // Pega só o token

  try {
    // 2. Verifica se o token é válido
    const payload = jwt.verify(token, secret);

    // 3. Adiciona os dados do usuário (id, tipo) ao objeto 'req'
    // para que a próxima rota (o controller) possa usá-lo
    req.usuario = payload; 

    next(); // Deixa a requisição continuar
  } catch (ex) {
    res.status(400).json({ erro: 'Token inválido.' });
  }
};

// Middleware de Autorização (Checa se é Professor)
const isProfessor = (req, res, next) => {
  // Roda DEPOIS do authMiddleware, por isso temos 'req.usuario'
  if (req.usuario.tipo !== 'PROFESSOR') {
    return res.status(403).json({ erro: 'Acesso negado. Rota apenas para professores.' });
  }
  next();
};

module.exports = { authMiddleware, isProfessor };