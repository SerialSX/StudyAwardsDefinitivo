const jwt = require('jsonwebtoken');
const secret = "minha-senha-secreta-super-dificil";

const authMiddleware = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Acesso negado. Nenhum token fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, secret);

    req.usuario = payload; 

    next();
  } catch (ex) {
    res.status(400).json({ erro: 'Token inválido.' });
  }
};

const isProfessor = (req, res, next) => {
  if (req.usuario.tipo !== 'PROFESSOR') {
    return res.status(403).json({ erro: 'Acesso negado. Rota apenas para professores.' });
  }
  next();
};

module.exports = { authMiddleware, isProfessor };