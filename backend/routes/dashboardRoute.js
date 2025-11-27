const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController.js'); // Verifique se o nome do arquivo do controller está certo
const { authMiddleware, isProfessor } = require('../middleware/authMiddleware.js');

// Rota para pegar os números do painel (Total Alunos, Presentes, etc)
router.get('/api/professor/resumo', authMiddleware, isProfessor, dashboardController.getResumoProfessor);

module.exports = router;