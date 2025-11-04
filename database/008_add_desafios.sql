DELETE FROM desafios;
DELETE FROM aluno_desafios;

INSERT INTO desafios (titulo, descricao, pontos, prazo_final, criado_por_professor_id) VALUES
('Pesquisa sobre IA', 'Escrever 300 palavras sobre os avanços recentes em IA.', 50, '2025-11-15', 13), 
('Exercícios de Matemática', 'Resolver a lista de exercícios da página 42.', 30, '2025-11-10', 13),
('Leitura Complementar', 'Ler o capítulo 5 do livro de História.', 20, NULL, 13);

INSERT INTO aluno_desafios (aluno_id, desafio_id, status) VALUES
(14, (SELECT id FROM desafios WHERE titulo = 'Pesquisa sobre IA'), 'pendente'),
(14, (SELECT id FROM desafios WHERE titulo = 'Exercícios de Matemática'), 'pendente'),
(14, (SELECT id FROM desafios WHERE titulo = 'Leitura Complementar'), 'pendente');
