document.addEventListener('DOMContentLoaded', () => {

    // 1. Pegar os dados do professor logado (salvos no login)
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        console.error('Nenhum usuário logado encontrado. Redirecionando para o login.');
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);

    // Verifica se é professor
    if (usuarioLogado.tipo !== 'PROFESSOR') {
        console.error('Usuário logado não é um professor. Acesso negado.');
        alert('Acesso negado. Esta área é apenas para professores.');
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../index.html';
        return;
    }

    async function carregarDadosProfessor() {
        try {
            const respostaRanking = await fetch('http://localhost:3000/ranking');

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

        document.getElementById('presentes-hoje').textContent = '...';
        const percentualPresenca = '...';
        document.getElementById('percentual-presenca').textContent = `${percentualPresenca}% de presença`; // Placeholder
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

        listaPresenca.querySelectorAll('.presence-buttons button').forEach(button => {
            button.addEventListener('click', (event) => {
                const clickedButton = event.target;
                const parentDiv = clickedButton.parentElement;
                const alunoId = parentDiv.dataset.alunoId;

                parentDiv.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                clickedButton.classList.add('active');

                const estaPresente = clickedButton.classList.contains('btn-presence');
                console.log(`Aluno ID: ${alunoId}, Presente: ${estaPresente}`);
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