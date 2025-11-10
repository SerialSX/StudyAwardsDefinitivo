const express = require('express');
const router = express.Router();
const desafioController = require('../controllers/desafioController.js');
const { authMiddleware, isProfessor } = require('../middleware/authMiddleware.js');

router.get('/api/desafios', authMiddleware, desafioController.getDesafiosAluno);

router.post('/api/desafios', authMiddleware, isProfessor, desafioController.criarDesafio);
router.post('/api/desafios/completar/:id', authMiddleware, desafioController.completarDesafio);
router.post('/api/desafios/atribuir-todos', authMiddleware, isProfessor, desafioController.atribuirDesafioParaTodos);

module.exports = router;