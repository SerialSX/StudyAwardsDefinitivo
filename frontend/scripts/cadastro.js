/* frontend/scripts/cadastro.js */

document.addEventListener('DOMContentLoaded', () => {
    // URL API
    const API_URL = "https://studyawardsdefinitivo-production.up.railway.app"; 

    const cadastroForm = document.getElementById('cadastro-form');
    
    // Elementos visuais
    const radiosTipo = document.querySelectorAll('input[name="tipo"]');
    const campoAlunoContainer = document.getElementById('campo-aluno-container');
    const campoProfessorContainer = document.getElementById('campo-professor-container');
    const inputAlunoId = document.getElementById('alunoId');
    const inputCodigoProf = document.getElementById('codigoProfessor');

    // 1. Mostrar/Esconder campos
    radiosTipo.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const tipo = e.target.value;
            
            // Reset
            if(campoAlunoContainer) campoAlunoContainer.style.display = 'none';
            if(campoProfessorContainer) campoProfessorContainer.style.display = 'none';
            if(inputAlunoId) inputAlunoId.required = false;
            if(inputCodigoProf) inputCodigoProf.required = false;

            // Ativa específico
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

    // 2. Envio do Cadastro
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const btnSubmit = cadastroForm.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerText;
            btnSubmit.innerText = "Cadastrando...";
            btnSubmit.disabled = true;

            // Captura dados
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const tipo = document.querySelector('input[name="tipo"]:checked').value;
            const alunoId = document.getElementById('alunoId').value;
            const codigoProfessor = document.getElementById('codigoProfessor').value;

            const dadosCadastro = {
                nome, email, senha, tipo,
                alunoId: alunoId ? parseInt(alunoId) : null,
                codigoProfessor: (tipo === 'PROFESSOR') ? codigoProfessor : undefined
            };

            try {
                const response = await fetch(`${API_URL}/api/cadastro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosCadastro)
                });

                const data = await response.json();

                if (response.ok) {
                    await Swal.fire({
                        title: 'Sucesso! 🎉',
                        text: 'Conta criada. Faça login para continuar.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    // --- CORREÇÃO DE CAMINHO PARA O MODAL NA RAIZ ---
                    // Como estamos na index.html, o caminho para pages é direto "pages/..."
                    if (tipo === 'ALUNO') window.location.href = 'pages/login-aluno.html';
                    else if (tipo === 'PROFESSOR') window.location.href = 'pages/login-professor.html';
                    else window.location.href = 'pages/login-responsavel.html';

                } else {
                    Swal.fire('Erro', data.erro || 'Erro ao cadastrar.', 'warning');
                    btnSubmit.innerText = textoOriginal;
                    btnSubmit.disabled = false;
                }

            } catch (error) {
                console.error(error);
                Swal.fire('Erro', 'Falha na conexão.', 'error');
                btnSubmit.innerText = textoOriginal;
                btnSubmit.disabled = false;
            }
        });
    }
});