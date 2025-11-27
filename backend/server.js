const express = require('express');
const cors = require('cors');
const path = require('path'); 

// --- MUDANÇA AQUI ---
// Removemos { db, criarTabelas } e deixamos sem nada, 
// pois o server.js não acessa o banco direto, só os controllers acessam.
// Se quiser garantir que conecta, o próprio require já roda o console.log da conexão.
require('./config/database.js'); 

const rankingRoutes = require('./routes/rankingRoutes.js');
const usuarioRoutes = require('./routes/usuarioRoutes.js');
const penalidadeRoutes = require('./routes/penalidadeRoutes.js');
const desafioRoutes = require('./routes/desafioRoutes.js');
const dashboardRoute = require('./routes/dashboardRoute.js'); // Rota do resumo
const errorHandler = require('./middleware/errorHandler.js');

const app = express();

const PORT = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json());

// --- MUDANÇA AQUI ---
// A linha criarTabelas(); FOI REMOVIDA porque já criamos no pgAdmin.

// Configuração de Imagens
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/', rankingRoutes);
app.use('/', usuarioRoutes);
app.use('/', penalidadeRoutes);
app.use('/', desafioRoutes);
app.use('/', dashboardRoute);

app.get('/', (req, res) => {
  res.send('API StudyAwards com PostgreSQL está Online! 🐘');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});