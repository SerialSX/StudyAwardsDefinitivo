-- (Opcional) Primeiro, garanta que os desafios existem na tabela 'desafios'
-- Se você já fez isso antes, pode pular esta parte
INSERT OR IGNORE INTO desafios (id, titulo, descricao, pontos) VALUES (1, 'Pesquisa sobre IA', 'Escrever 300 palavras', 50);
INSERT OR IGNORE INTO desafios (id, titulo, descricao, pontos) VALUES (2, 'Exercícios de Matemática', 'Página 42', 30);
INSERT OR IGNORE INTO desafios (id, titulo, descricao, pontos) VALUES (3, 'Leitura Complementar', 'Capítulo 5', 20);

-- Limpa associações antigas do Kauê (só por garantia)
DELETE FROM aluno_desafios WHERE aluno_id = 2;

-- **ASSOCIA os desafios ao Kauê (ID 2)**
INSERT INTO aluno_desafios (aluno_id, desafio_id, status) VALUES
(2, 1, 'pendente'), -- Associa Desafio 1 ao Aluno 2
(2, 2, 'pendente'), -- Associa Desafio 2 ao Aluno 2
(2, 3, 'pendente'); -- Associa Desafio 3 ao Aluno 2