document.addEventListener('DOMContentLoaded', () => {
    // Encontra o formulário pelo ID que demos a ele no HTML
    const cadastroForm = document.getElementById('cadastro-form');
    // Encontra o elemento de mensagem de erro
    const errorMessageEl = document.getElementById('error-message');

    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o envio padrão do formulário 
            errorMessageEl.textContent = '';

            //Pega os valores
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;

            //Pega o valor do botão tipo que está selecionado
            const tipo = document.querySelector('input[name="tipo"]:checked').value;
            const dadosCadastro = {
                nome: nome,
                email: email,
                senha: senha,
                tipo: tipo 
            };

            //Envia os dados para a API de cadastro
            try {
                const response = await fetch('http://localhost:3000/api/cadastro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dadosCadastro)
                });

                const data = await response.json();

                //Envia o novo usuário para a tela de seleção de perfil
                if (response.ok) {
                    alert('Cadastro realizado com sucesso! Você será redirecionado para a tela inicial para fazer o login.');
                    window.location.href = '../index.html';

                    // Erro da API
                } else {
                    console.error('Erro ao cadastrar:', data.erro);
                    errorMessageEl.textContent = `Erro: ${data.erro}`;
                }

                //Erro de rede 
            } catch (error) {
                console.error('Erro de conexão:', error);
                errorMessageEl.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
            }
        });
    }
});