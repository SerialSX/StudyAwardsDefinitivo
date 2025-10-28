-- 1. Deleta todos os registros de desafios de alunos
DELETE FROM aluno_desafios;

-- 2. Deleta todas as penalidades para começar o histórico do zero
DELETE FROM penalidades;

-- 3. Reseta a pontuação do Beto (aluno ID 2) para o valor original
UPDATE usuarios SET pontuacao_total = 500 WHERE id = 2;