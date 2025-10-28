Checar usuarios e emails: SELECT id, nome, email, tipo FROM usuarios;
Checar senhas: SELECT id, email, senha FROM usuarios;

Checar tipo: SELECT id, nome, email, tipo FROM usuarios WHERE email = 'carla@email.com'; (Mude o email de checagem.)
Mudar tipo: UPDATE usuarios SET tipo = 'ALUNO' WHERE email = 'ana@email.com'; (Mude o email e o tipo)