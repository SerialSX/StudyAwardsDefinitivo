CREATE TABLE IF NOT EXISTS frequencia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  data_falta TEXT NOT NULL,
  registrado_por_professor_id INTEGER, 
  FOREIGN KEY (aluno_id) REFERENCES usuarios (id)
);