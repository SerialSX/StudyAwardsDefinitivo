document.addEventListener('DOMContentLoaded', () => {
    const cadastroForm = document.getElementById('cadastro-form');
    const errorMessageEl = document.getElementById('error-message');
    
    // Elementos para controle do campo extra
    const campoAlunoContainer = document.getElementById('campo-aluno-container');
    const inputAlunoId = document.getElementById('alunoId');
    const radiosTipo = document.querySelectorAll('input[name="tipo"]');

    // 1. Lógica para Mostrar/Esconder o campo de Aluno ID
    radiosTipo.forEach(radio => {
        radio.addEventListener('change', (e) => {
            console.log("Mudou o tipo para:", e.target.value); // Log para debug

            if (e.target.value === 'RESPONSAVEL') {
                // Se for responsável, MOSTRA o campo
                if(campoAlunoContainer) {
                    campoAlunoContainer.style.display = 'block';
                    inputAlunoId.required = true;
                }
            } else {
                // Se não, ESCONDE
                if(campoAlunoContainer) {
                    campoAlunoContainer.style.display = 'none';
                    inputAlunoId.required = false;
                    inputAlunoId.value = ''; 
                }
            }
        });
    });

    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessageEl.textContent = ''; 

            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            
            // Verifica qual radio está marcado
            const tipoRadio = document.querySelector('input[name="tipo"]:checked');
            const tipo = tipoRadio ? tipoRadio.value : 'ALUNO';
            
            const alunoId = document.getElementById('alunoId').value;

            const dadosCadastro = {
                nome: nome,
                email: email,
                senha: senha,
                tipo: tipo,
                alunoId: alunoId ? parseInt(alunoId) : null
            };

            try {
                const response = await fetch('http://localhost:3000/api/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosCadastro)
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Cadastro realizado com sucesso! Faça login para continuar.');
                    window.location.href = '../index.html';
                } else {
                    console.error('Erro ao cadastrar:', data.erro);
                    errorMessageEl.textContent = `Erro: ${data.erro}`;
                }

            } catch (error) {
                console.error('Erro de conexão:', error);
                errorMessageEl.textContent = 'Erro ao conectar com o servidor.';
            }
        });
    }
});