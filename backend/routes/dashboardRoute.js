const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController.js');
const { authMiddleware, isProfessor } = require('../middleware/authMiddleware.js');

// Rota Professor
router.get('/api/professor/resumo', authMiddleware, isProfessor, dashboardController.getResumoProfessor);
router.get('/api/dashboard/professor/aluno/:id', authMiddleware, isProfessor, dashboardController.getDetalhesAluno);

// Rota Aluno (NOVA)
router.get('/api/dashboard/aluno', authMiddleware, dashboardController.getDashboardAluno);

// Rota Responsável (NOVA)
router.get('/api/dashboard/responsavel', authMiddleware, dashboardController.getDashboardResponsavel);

module.exports = router;