const { Pool } = require('pg');

// --- PREENCHA SEUS DADOS AQUI ---
// Formato: postgres://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
// Geralmente o usuário é 'postgres' e a porta é '5432'
const connectionString = 'postgresql://postgres:230313@localhost:5432/studyaward';

const pool = new Pool({
  connectionString: connectionString,
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Erro fatal: Não foi possível conectar ao PostgreSQL!', err.message);
    console.error('Dica: Verifique se a senha no arquivo database.js está certa.');
  } else {
    console.log('✅ Conectado ao PostgreSQL com sucesso!');
  }
});

// Exporta o método query e o pool para transações
module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback),
  pool
};