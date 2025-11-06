const express = require('express');
const cors = require('cors');
const { db, criarTabelas } = require('./config/database.js'); 
const rankingRoutes = require('./routes/rankingRoutes.js');
const usuarioRoutes = require('./routes/usuarioRoutes.js');
const penalidadeRoutes = require('./routes/penalidadeRoutes.js');
const desafioRoutes = require('./routes/desafioRoutes.js');
const errorHandler = require('./middleware/errorHandler.js');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

criarTabelas();

app.use('/', rankingRoutes);
app.use('/', usuarioRoutes);
app.use('/', penalidadeRoutes);
app.use('/', desafioRoutes);
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('Servidor funcionando e conectado ao banco de dados!');
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado e rodando na porta ${PORT}. Servidor
    funcionando e conectado ao banco de dados!`);
});