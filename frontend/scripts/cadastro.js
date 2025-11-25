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
            const tipo = e.target.value;
            
            // Elementos visuais
            const campoResponsavel = document.getElementById('campo-aluno-container');
            const campoProfessor = document.getElementById('campo-professor-container'); // <--- NOVO
            const inputCodigoProf = document.getElementById('codigoProfessor'); // <--- NOVO

            // Reseta tudo primeiro (esconde tudo)
            if(campoResponsavel) {
                campoResponsavel.style.display = 'none';
                document.getElementById('alunoId').required = false;
            }
            if(campoProfessor) { // <--- NOVO
                campoProfessor.style.display = 'none';
                inputCodigoProf.required = false;
            }

            // Ativa o específico
            if (tipo === 'RESPONSAVEL') {
                if(campoResponsavel) {
                    campoResponsavel.style.display = 'block';
                    document.getElementById('alunoId').required = true;
                }
            } else if (tipo === 'PROFESSOR') { // <--- BLOCO NOVO
                if(campoProfessor) {
                    campoProfessor.style.display = 'block';
                    inputCodigoProf.required = true;
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

            const codigoProfessorValor = document.getElementById('codigoProfessor').value;

            const dadosCadastro = {
                nome: nome,
                email: email,
                senha: senha,
                tipo: tipo,
                alunoId: alunoId ? parseInt(alunoId) : null,
                // Envia o código SE for professor
                codigoProfessor: (tipo === 'PROFESSOR') ? codigoProfessorValor : undefined
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