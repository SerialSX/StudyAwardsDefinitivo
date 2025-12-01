/* backend/routes/dashboardRoute.js */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController.js');
const { authMiddleware, isProfessor } = require('../middleware/authMiddleware.js');


router.get('/api/dashboard/professor', authMiddleware, isProfessor, dashboardController.getDashboardProfessor);
router.get('/api/dashboard/professor/aluno/:id', authMiddleware, isProfessor, dashboardController.getDetalhesAluno);
router.get('/api/dashboard/aluno', authMiddleware, dashboardController.getDashboardAluno);
router.get('/api/dashboard/responsavel', authMiddleware, dashboardController.getDashboardResponsavel);

// Legado (se ainda for usado em algum lugar antigo)
router.get('/api/professor/resumo', authMiddleware, isProfessor, dashboardController.getDashboardProfessor);

module.exports = router;