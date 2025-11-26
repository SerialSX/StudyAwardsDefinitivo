document.addEventListener('DOMContentLoaded', () => {
    const cadastroForm = document.getElementById('cadastro-form');
    
    // Elementos para controle dos campos extras
    const radiosTipo = document.querySelectorAll('input[name="tipo"]');
    
    // --- CORREÇÃO: Pegando os IDs certos do HTML ---
    const campoAlunoContainer = document.getElementById('campo-aluno-container');
    const campoProfessorContainer = document.getElementById('campo-professor-container');
    
    const inputAlunoId = document.getElementById('alunoId');
    const inputCodigoProf = document.getElementById('codigoProfessor');

    // 1. Lógica Visual: Mostrar/Esconder campos conforme o tipo
    radiosTipo.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const tipo = e.target.value;
            
            // --- CORREÇÃO AQUI: Usando os nomes de variáveis certos ---
            
            // Primeiro, esconde tudo (Reset)
            if(campoAlunoContainer) campoAlunoContainer.style.display = 'none';
            if(campoProfessorContainer) campoProfessorContainer.style.display = 'none';
            
            // Tira a obrigatoriedade dos campos escondidos
            if(inputAlunoId) inputAlunoId.required = false;
            if(inputCodigoProf) inputCodigoProf.required = false;

            // Agora mostra o específico baseado na escolha
            if (tipo === 'RESPONSAVEL') {
                if(campoAlunoContainer) {
                    campoAlunoContainer.style.display = 'block';
                    if(inputAlunoId) inputAlunoId.required = true;
                }
            } else if (tipo === 'PROFESSOR') {
                if(campoProfessorContainer) {
                    campoProfessorContainer.style.display = 'block';
                    if(inputCodigoProf) inputCodigoProf.required = true;
                }
            }
        });
    });

    // 2. Envio do Formulário (Com SweetAlert2)
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Não recarrega a página

            // Pega os valores
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const tipo = document.querySelector('input[name="tipo"]:checked').value;
            
            const alunoId = document.getElementById('alunoId').value;
            const codigoProfessor = document.getElementById('codigoProfessor').value;

            const dadosCadastro = {
                nome, 
                email, 
                senha, 
                tipo,
                // Envia ID se for Responsável, Código se for Professor
                alunoId: alunoId ? parseInt(alunoId) : null,
                codigoProfessor: (tipo === 'PROFESSOR') ? codigoProfessor : undefined
            };

            try {
                const response = await fetch('http://localhost:3000/api/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosCadastro)
                });

                const data = await response.json();

                if (response.ok) {
                    // SUCESSO
                    await Swal.fire({
                        title: 'Cadastro Realizado! 🎉',
                        text: 'Sua conta foi criada. Você será redirecionado para o login.',
                        icon: 'success',
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false
                    });

                    // Redireciona para o login correto
                    if (tipo === 'ALUNO') window.location.href = '../pages/login-aluno.html';
                    else if (tipo === 'PROFESSOR') window.location.href = '../pages/login-professor.html';
                    else window.location.href = '../pages/login-responsavel.html';

                } else {
                    // ERRO
                    Swal.fire({
                        title: 'Atenção',
                        text: data.erro || 'Erro ao cadastrar.',
                        icon: 'warning',
                        confirmButtonColor: '#d33'
                    });
                }

            } catch (error) {
                console.error(error);
                Swal.fire('Erro de Conexão', 'Não foi possível conectar ao servidor.', 'error');
            }
        });
    }
});