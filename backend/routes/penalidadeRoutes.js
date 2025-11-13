const express = require('express');
const router = express.Router();
const penalidadeController = require('../controllers/penalidadeController.js');
const { authMiddleware, isProfessor } = require('../middleware/authMiddleware.js');

router.get('/alunos/:id/penalidades', authMiddleware, penalidadeController.getPenalidades);
router.post('/registrar-falta', authMiddleware, isProfessor, penalidadeController.registrarFalta);
router.get('/verificar-atrasos', authMiddleware, isProfessor, penalidadeController.verificarAtrasos);

module.exports = router;