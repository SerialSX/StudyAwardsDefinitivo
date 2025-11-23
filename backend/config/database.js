const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './banco.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados 'banco.db' com sucesso.");
  }
});

const criarTabelas = () => {
  db.serialize(() => {
    console.log("Inicializando tabelas...");
    
    // aluno_associado_id 
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      nome TEXT NOT NULL, 
      email TEXT UNIQUE NOT NULL, 
      senha TEXT NOT NULL, 
      tipo TEXT NOT NULL, 
      pontuacao_total INTEGER DEFAULT 0,
      aluno_associado_id INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS penalidades (id INTEGER PRIMARY KEY AUTOINCREMENT, aluno_id INTEGER NOT NULL, motivo TEXT NOT NULL, pontos_deduzidos INTEGER DEFAULT 0, data TEXT NOT NULL, FOREIGN KEY (aluno_id) REFERENCES usuarios (id))`);
    db.run(`CREATE TABLE IF NOT EXISTS frequencia (id INTEGER PRIMARY KEY AUTOINCREMENT, aluno_id INTEGER NOT NULL, data_falta TEXT NOT NULL, registrado_por_professor_id INTEGER, FOREIGN KEY (aluno_id) REFERENCES usuarios (id))`);
    db.run(`CREATE TABLE IF NOT EXISTS desafios (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, descricao TEXT, pontos INTEGER NOT NULL, prazo_final TEXT, criado_por_professor_id INTEGER, FOREIGN KEY (criado_por_professor_id) REFERENCES usuarios (id))`);
    db.run(`CREATE TABLE IF NOT EXISTS aluno_desafios (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      aluno_id INTEGER NOT NULL, 
      desafio_id INTEGER NOT NULL, 
      status TEXT NOT NULL DEFAULT 'pendente', 
      data_conclusao TEXT, 
      comprovante_path TEXT,  -- <--- ADICIONE ISTO
      FOREIGN KEY (aluno_id) REFERENCES usuarios (id), 
      FOREIGN KEY (desafio_id) REFERENCES desafios (id)
    )`);
  });
};



module.exports = { db, criarTabelas };