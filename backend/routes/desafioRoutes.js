const express = require('express');
const router = express.Router();
const desafioController = require('../controllers/desafioController.js');
const { authMiddleware, isProfessor } = require('../middleware/authMiddleware.js');
const upload = require('../config/upload.js');

router.get('/api/desafios', authMiddleware, desafioController.getDesafiosAluno);
router.post('/api/desafios', authMiddleware, isProfessor, desafioController.criarDesafio);

router.post('/api/desafios/completar/:id', authMiddleware, upload.single('comprovante'), desafioController.completarDesafio);
router.post('/api/desafios/atribuir-todos', authMiddleware, isProfessor, desafioController.atribuirDesafioParaTodos);

module.exports = router;