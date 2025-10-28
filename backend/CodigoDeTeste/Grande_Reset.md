-- PASSO 1: LIMPA COMPLETAMENTE OS DADOS DE TESTES ANTERIORES
DELETE FROM aluno_desafios;
DELETE FROM desafios;
DELETE FROM penalidades;
DELETE FROM frequencia;
DELETE FROM usuarios WHERE email IN ('ana@email.com', 'beto@email.com', 'carla@email.com');

-- PASSO 2: INSERE OS USUÁRIOS ORIGINAIS COM PONTUAÇÕES INICIAIS
INSERT INTO usuarios (id, nome, email, senha, tipo, pontuacao_total) VALUES 
(1, 'Ana', 'ana@email.com', 'senha123', 'aluno', 250),
(2, 'Beto', 'beto@email.com', 'senha123', 'aluno', 500),
(3, 'Carla', 'carla@email.com', 'senha123', 'aluno', 120);

-- PASSO 3: CRIA UM ÚNICO DESAFIO COM PRAZO VENCIDO
INSERT INTO desafios (id, titulo, descricao, pontos, prazo_final, criado_por_professor_id) 
VALUES (1, 'Pesquisa Histórica', 'Pesquisar sobre a Revolução Francesa', 150, '2025-10-01', 101);

-- PASSO 4: ATRIBUI O DESAFIO VENCIDO APENAS AO ALUNO DE ID 2 (BETO)
INSERT INTO aluno_desafios (aluno_id, desafio_id, status)
VALUES (2, 1, 'pendente');

Versão v2:

-- LIMPA COMPLETAMENTE OS DADOS DE TESTES ANTERIORES
DELETE FROM aluno_desafios;
DELETE FROM desafios;
DELETE FROM penalidades;
DELETE FROM frequencia;
DELETE FROM usuarios WHERE email IN ('ana@email.com', 'beto@email.com', 'carla@email.com');

-- INSERE OS USUÁRIOS ORIGINAIS COM PONTUAÇÕES INICIAIS
INSERT INTO usuarios (id, nome, email, senha, tipo, pontuacao_total) VALUES 
(1, 'Ana', 'ana@email.com', 'senha123', 'aluno', 250),
(2, 'Beto', 'beto@email.com', 'senha123', 'aluno', 500),
(3, 'Carla', 'carla@email.com', 'senha123', 'aluno', 120);