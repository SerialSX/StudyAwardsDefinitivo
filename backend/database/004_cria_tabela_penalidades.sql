CREATE TABLE IF NOT EXISTS penalidades (
  
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  pontos_deduzidos INTEGER DEFAULT 0,
  data TEXT NOT NULL,
  FOREIGN KEY (aluno_id) REFERENCES usuarios (id)
);