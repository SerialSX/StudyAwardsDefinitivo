document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURAÇÃO DA API ---
    // Comente a linha de cima e descomente a de baixo quando for subir pro Vercel
    
    // 1. Rodando no seu PC:
    // const API_URL = "http://localhost:3000"; 

    // 2. Rodando na Vercel:
    // (Cole o seu link do Railway aqui dentro das aspas, sem a barra / no final)
    const API_URL = "https://studyawardsdefinitivo-production.up.railway.app"; 

    // ---------------------------------------------

    const loginForm = document.querySelector('.login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Não deixa recarregar a página

            const email = document.getElementById('usuario').value; 
            const senha = document.getElementById('senha').value;

            // Feedback visual no botão (opcional, mas fica chique)
            const btn = loginForm.querySelector('button[type="submit"]');
            const textoOriginal = btn.innerText;
            btn.innerText = "Entrando...";
            btn.disabled = true;

            try {
                // USA A VARIÁVEL AQUI (MUDANÇA PRINCIPAL)
                const response = await fetch(`${API_URL}/api/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        senha: senha
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Salva sessão
                    localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
                    localStorage.setItem('token', data.token);

                    // Checa o tipo de usuario e define destino
                    let destination = '';
                    if (data.usuario.tipo === 'ALUNO') {
                        destination = 'dashboard-aluno.html';
                    } else if (data.usuario.tipo === 'PROFESSOR') {
                        destination = 'dashboard-professor.html';
                    } else if (data.usuario.tipo === 'RESPONSAVEL') {
                        destination = 'dashboard-responsavel.html';
                    }

                    if (destination) {
                        // Sucesso (Não precisa de alert aqui, redireciona direto é mais fluido)
                        window.location.href = destination;
                    } else {
                        Swal.fire('Erro', 'Tipo de usuário desconhecido!', 'error');
                        btn.innerText = textoOriginal;
                        btn.disabled = false;
                    }

                } else {
                    // Erro no login (Senha errada, email não existe)
                    Swal.fire({
                        title: 'Falha no Login',
                        text: data.erro || 'Usuário ou senha incorretos.',
                        icon: 'error',
                        confirmButtonColor: '#d33'
                    });
                    btn.innerText = textoOriginal;
                    btn.disabled = false;
                }

            } catch (error) {
                // Erro de rede (Servidor fora do ar)
                console.error('Erro ao tentar fazer login:', error);
                Swal.fire('Servidor Offline', 'Não foi possível conectar ao sistema. Tente novamente.', 'error');
                btn.innerText = textoOriginal;
                btn.disabled = false;
            }
        });
    }
});