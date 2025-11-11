document.addEventListener('DOMContentLoaded', () => {

        //Checa se exite usuario logado
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        console.error('Nenhum usuário logado encontrado. Redirecionando para o login.');
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);
    //Verifica se é um professor
    if (usuarioLogado.tipo !== 'PROFESSOR') {
        console.error('Usuário logado não é um professor. Acesso negado.');
        alert('Acesso negado. Esta área é apenas para professores.');
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../index.html';
        return;
    }

   
    // Criar Desafio
    const btnNovaAtividade = document.querySelector('.dashboard-header .btn-primary');
    const modalOverlay = document.getElementById('modal-overlay');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal');
    const formCriarDesafio = document.getElementById('form-criar-desafio');
    const modalErrorMessage = document.getElementById('modal-error-message');

    function abrirModal() {
        modalOverlay.style.display = 'flex';
    }

    function fecharModal() {
        modalOverlay.style.display = 'none';
        modalErrorMessage.textContent = '';
        formCriarDesafio.reset(); // Limpa o formulário
    }

    btnNovaAtividade.addEventListener('click', abrirModal);
    btnCancelarModal.addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            fecharModal();
        }
    });

    //Enviar o formulário de criação de desafio
    formCriarDesafio.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        modalErrorMessage.textContent = ''; 

        //Pega os dados 
        const titulo = document.getElementById('desafio-titulo').value;
        const descricao = document.getElementById('desafio-descricao').value;
        const pontos = parseInt(document.getElementById('desafio-pontos').value);
        const prazo_final = document.getElementById('desafio-prazo').value;
        
        const token = localStorage.getItem('token');

        const dadosDesafio = {
            titulo: titulo,
            descricao: descricao,
            pontos: pontos,
            prazo_final: prazo_final ? prazo_final : null 
        };

        try {
            //Chama a API desafios
            const response = await fetch('http://localhost:3000/api/desafios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` //
                },
                body: JSON.stringify(dadosDesafio)
            });

            const data = await response.json();

            if (response.ok) {
                const novoDesafio = data;
                alert(`Desafio "${novoDesafio.titulo}" criado! Atribuindo a todos os alunos...`);

                // Chamar a API atribuir-todos
                try {
                    const responseAtribuir = await fetch('http://localhost:3000/api/desafios/atribuir-todos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ desafio_id: novoDesafio.id }) // Envia o ID do desafio recém-criado
                    });

                    const dataAtribuir = await responseAtribuir.json();

                    if (responseAtribuir.ok) {
                        alert(`Desafio atribuído para ${dataAtribuir.total_alunos_atribuidos} aluno(s).`);
                        fecharModal();
                    } else {
                        //Erro ao atribuir
                        modalErrorMessage.textContent = `Erro ao atribuir: ${dataAtribuir.erro}`;
                    }

                } catch (error) {
                    //Erro de rede 
                    console.error('Erro de conexão ao atribuir:', error);
                    modalErrorMessage.textContent = 'Erro de conexão ao atribuir o desafio.';
                }

            } else {
                // Erro da API
                console.error('Erro ao criar desafio:', data.erro);
                modalErrorMessage.textContent = `Erro: ${data.erro}`;
            }

        } catch (error) {
            // Erro de rede 
            console.error('Erro de conexão:', error);
            modalErrorMessage.textContent = 'Não foi possível conectar ao servidor.';
        }
    });
        //carrega dados do professor
         async function carregarDadosProfessor() {
        try {
            const token = localStorage.getItem('token');
            const respostaRanking = await fetch('http://localhost:3000/ranking', {
                headers: { 'Authorization': `Bearer ${token}` } //
            });

            if (!respostaRanking.ok) {
                console.error('Erro ao buscar o ranking:', respostaRanking.status);
                alert('Erro ao carregar os dados do ranking.');
                return;
            }

            const dadosRanking = await respostaRanking.json();
            const alunos = dadosRanking.ranking;

            preencherStatusCards(alunos);
            preencherControleDePresenca(alunos);
            preencherRelatorioDesempenho(alunos);

        } catch (error) {
            console.error('Erro ao carregar os dados do professor:', error);
            alert('Erro de conexão ao carregar dados do dashboard do professor.');
        }
    }

    function preencherStatusCards(alunos) {
        const totalAlunos = alunos.length;
        document.getElementById('total-alunos').textContent = totalAlunos;
        
        //presença e atividades 
        document.getElementById('presentes-hoje').textContent = '...'; 
        const percentualPresenca = '...';
        document.getElementById('percentual-presenca').textContent = `${percentualPresenca}% de presença`;
        document.getElementById('atividades-ativas').textContent = '...';
    }

    function preencherControleDePresenca(alunos) {
        const listaPresenca = document.getElementById('lista-presenca');
        listaPresenca.innerHTML = '';

        alunos.forEach(aluno => {
            const itemLista = document.createElement('li');
            itemLista.className = 'student-row';

            itemLista.innerHTML = `
                <div>
                    <h4>${aluno.nome}</h4>
                    <p>${aluno.pontuacao_total} pontos</p> 
                </div>
                <div class="presence-buttons" data-aluno-id="${aluno.id}">
                    <button class="btn-presence">Presente</button> 
                    <button class="btn-absence">Ausente</button>
                </div>
            `;
            listaPresenca.appendChild(itemLista);
        });

        //lógica de clique para os botões de presença
        listaPresenca.querySelectorAll('.presence-buttons button').forEach(button => {
            button.addEventListener('click', (event) => {
                const clickedButton = event.target;
                const parentDiv = clickedButton.parentElement;
                const alunoId = parentDiv.dataset.alunoId;

                parentDiv.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                clickedButton.classList.add('active');

                const estaPresente = clickedButton.classList.contains('btn-presence');
                console.log(`Aluno ID: ${alunoId}, Presente: ${estaPresente}`);
                
                //Esperando a Andreina colocar a API de registrar falta
            });
        });
    }

    function preencherRelatorioDesempenho(alunos) {
        const listaDesempenho = document.getElementById('lista-desempenho');
        listaDesempenho.innerHTML = '';

        alunos.forEach((aluno, index) => {
            const itemLista = document.createElement('li');
            itemLista.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span>${aluno.nome}</span>
                <span class="points">${aluno.pontuacao_total} pontos</span>
            `;
            listaDesempenho.appendChild(itemLista);
        });
    }
    carregarDadosProfessor();
});