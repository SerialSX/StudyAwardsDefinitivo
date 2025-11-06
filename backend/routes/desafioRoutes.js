// backend/routes/desafioRoutes.js

const express = require('express');
const router = express.Router();

const desafioController = require('../controllers/desafioController.js');
// 1. Importa os "seguranças"
const { authMiddleware, isProfessor } = require('../middleware/authMiddleware.js');

// 2. Rota de listar (protegida por login)
// Primeiro roda o 'authMiddleware' (checa o crachá), depois roda o controller
router.get('/api/desafios', authMiddleware, desafioController.getDesafiosAluno);

// 3. Rota de criar (protegida por login E por tipo "Professor")
// Roda 'authMiddleware' (checa crachá) -> Roda 'isProfessor' (checa se é professor) -> Roda o controller
router.post('/api/desafios', authMiddleware, isProfessor, desafioController.criarDesafio);

module.exports = router;