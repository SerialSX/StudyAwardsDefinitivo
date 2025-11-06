// backend/routes/usuarioRoutes.js

const express = require('express');
const router = express.Router();

// 1. Importa o novo controller de usuário
const usuarioController = require('../controllers/usuarioController.js');

// 2. Define as URLs e liga aos controllers
router.get('/usuarios/:id/pontuacao', usuarioController.getPontuacao);
router.post('/usuarios/:id/pontuacao', usuarioController.updatePontuacao);
router.post('/api/cadastro', usuarioController.cadastro);
router.post('/api/login', usuarioController.login);

// 3. Exporta o router
module.exports = router;