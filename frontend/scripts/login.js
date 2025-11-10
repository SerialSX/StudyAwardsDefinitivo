document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('usuario').value; 
            const senha = document.getElementById('senha').value;

            //Puxa a API
            try {
                const response = await fetch('http://localhost:3000/api/login', {
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
                    localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
                    localStorage.setItem('token', data.token);

                //checa o tipo de usuario
                    let destination = '';
                    if (data.usuario.tipo === 'ALUNO') {
                        destination = 'dashboard-aluno.html';
                    } else if (data.usuario.tipo === 'PROFESSOR') {
                        destination = 'dashboard-professor.html';
                    } else if (data.usuario.tipo === 'RESPONSAVEL') {
                        destination = 'dashboard-responsavel.html';
                    }

                    if (destination) {
                        window.location.href = destination;
                    } else {
                        alert('Tipo de usuário desconhecido!');
                    }

                } else {
                    //Erro no login
                    alert(`Erro no login: ${data.erro}`);
                }

            } catch (error) {
                //Erro de rede 
                console.error('Erro ao tentar fazer login:', error);
                alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
            }
        });
    }
});