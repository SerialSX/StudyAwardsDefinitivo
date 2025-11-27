const { Pool } = require('pg');

// AQUI ESTÁ A MÁGICA:
// Se existir process.env.DATABASE_URL (Railway), usa ela.
// Se não (Seu PC), usa a string local fixa.
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

const connectionString = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL 
  : 'postgresql://postgres:230313@localhost:5432/studyawards'; // <--- SEU LINK LOCAL AQUI

const pool = new Pool({
  connectionString: connectionString,
  // O Railway EXIGE SSL (Criptografia). O Localhost NÃO aceita SSL.
  // Essa lógica resolve o problema dos dois mundos:
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Erro fatal: Não foi possível conectar ao PostgreSQL!', err.message);
  } else {
    console.log('✅ Conectado ao PostgreSQL com sucesso!');
  }
});

module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback),
  pool
};