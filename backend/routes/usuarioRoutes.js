const { authMiddleware } = require('../middleware/authMiddleware.js');
const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController.js');

router.get('/usuarios/:id/pontuacao', authMiddleware, usuarioController.getPontuacao);
router.post('/usuarios/:id/pontuacao', authMiddleware, usuarioController.updatePontuacao);
router.post('/api/cadastro', usuarioController.cadastro);
router.post('/api/login', usuarioController.login);

module.exports = router;