const express = require('express');
const router = express.Router();

const penalidadeController = require('../controllers/penalidadeController.js');

router.get('/alunos/:id/penalidades', penalidadeController.getPenalidades);
router.post('/registrar-falta', penalidadeController.registrarFalta);
router.get('/verificar-atrasos', penalidadeController.verificarAtrasos);

module.exports = router;