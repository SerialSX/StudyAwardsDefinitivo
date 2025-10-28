-- 1. Cria um desafio cujo prazo já passou
-- (Estou usando uma data do passado, 1º de Outubro de 2025)
INSERT INTO desafios (titulo, descricao, pontos, prazo_final, criado_por_professor_id) 
VALUES ('Redação sobre IA', 'Escrever 500 palavras sobre o futuro da IA', 100, '2025-10-01', 101);

-- 2. Atribui este desafio ao aluno de ID 2 (Beto) e o deixa como 'pendente'
-- (Este comando assume que o desafio que acabamos de criar recebeu o ID 1, o que é o normal se a tabela estava vazia)
INSERT INTO aluno_desafios (aluno_id, desafio_id, status)
VALUES (2, 1, 'pendente');