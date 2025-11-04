CREATE TABLE IF NOT EXISTS aluno_desafios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aluno_id INTEGER NOT NULL,
  desafio_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_conclusao TEXT,
  FOREIGN KEY (aluno_id) REFERENCES usuarios (id),
  FOREIGN KEY (desafio_id) REFERENCES desafios (id)
);