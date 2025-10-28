document.addEventListener('DOMContentLoaded', () => {

    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        console.error('Nenhum usuário logado encontrado. Redirecionando para o login.');
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);

    if (usuarioLogado.tipo !== 'ALUNO') {
        console.error('Usuário logado não é um aluno. Acesso negado.');
        alert('Acesso negado. Esta área é apenas para alunos.');
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../index.html';
        return;
    }

    async function carregarDadosAluno() {
        try {
            const urlPontuacao = `http://localhost:3000/usuarios/${usuarioLogado.id}/pontuacao`;
            const urlRanking = `http://localhost:3000/ranking`;
            const urlDesafios = `http://localhost:3000/api/desafios?alunoId=${usuarioLogado.id}`;
            const [respostaPontuacao, respostaRanking, respostaDesafios] = await Promise.all([
                fetch(urlPontuacao),
                fetch(urlRanking),
                fetch(urlDesafios)
            ]);

            if (!respostaPontuacao.ok || !respostaRanking.ok || !respostaDesafios.ok) {
                console.error('Erro ao buscar dados do backend:', respostaPontuacao.status, respostaRanking.status, respostaDesafios.status);
                alert('Erro ao carregar os dados do dashboard. Tente recarregar a página.');
                return;
            }

            const dadosPontuacao = await respostaPontuacao.json();
            const dadosRanking = await respostaRanking.json();
            const dadosDesafios = await respostaDesafios.json();

            document.getElementById('saudacao-aluno').textContent = `Olá, ${dadosPontuacao.nome}!`;
            document.getElementById('pontuacao-valor').textContent = dadosPontuacao.pontuacao_total;
            const minhaPosicao = dadosRanking.ranking.findIndex(aluno => aluno.id === usuarioLogado.id) + 1;
            const totalAlunos = dadosRanking.ranking.length;
            if (minhaPosicao > 0) {
                document.getElementById('ranking-valor').textContent = `#${minhaPosicao}`;
                document.getElementById('ranking-total').textContent = `de ${totalAlunos} alunos`;
            } else {
                document.getElementById('ranking-valor').textContent = `N/A`;
                document.getElementById('ranking-total').textContent = `de ${totalAlunos} alunos`;
            }
            document.getElementById('presenca-valor').textContent = `...%`;

            preencherAtividadesDisponiveis(dadosDesafios.desafios);

            const metaPontos = 1500;
            const progressoMeta = Math.round((dadosPontuacao.pontuacao_total / metaPontos) * 100);
            document.querySelector('.progress-info span:nth-child(2)').textContent = `${dadosPontuacao.pontuacao_total} / ${metaPontos} pontos`;
            document.querySelector('.progress-bar').style.width = `${Math.min(progressoMeta, 100)}%`;
            document.querySelector('.meta-description').textContent = `Você está a ${Math.max(0, metaPontos - dadosPontuacao.pontuacao_total)} pontos de atingir sua meta!`;

        } catch (error) {
            console.error('Erro ao carregar os dados do aluno:', error);
            alert('Erro de conexão ao carregar os dados do dashboard.');
        }
    }

    function preencherAtividadesDisponiveis(desafios) {
        const activitiesGrid = document.querySelector('.activities-grid');
        if (!activitiesGrid) return;
        activitiesGrid.innerHTML = '';

        if (!desafios || desafios.length === 0) {
            activitiesGrid.innerHTML = '<p>Nenhum desafio disponível no momento.</p>';
            return;
        }

        desafios.forEach(desafio => {
            const card = document.createElement('div');
            card.className = 'activity-card';
            if (desafio.status === 'concluido' || desafio.status === 'atrasado') {
                 card.classList.add('concluded');
            }

            card.innerHTML = `
                <div>
                    <h4>${desafio.titulo}</h4>
                    <p>${desafio.descricao || 'Sem descrição'}</p> 
                </div>
                ${desafio.status === 'pendente' ? `<div class="activity-points">${desafio.pontos} pts</div>` : ''}
                ${desafio.status === 'pendente' ? `<button class="btn btn-primary btn-small" data-aluno-desafio-id="${desafio.aluno_desafio_id}">Marcar como Concluído</button>` : `<div class="activity-status">Status: ${desafio.status}</div>`}
            `;

            activitiesGrid.appendChild(card);
        });

        activitiesGrid.querySelectorAll('.btn-primary').forEach(button => {
            button.addEventListener('click', (event) => {
                const alunoDesafioId = event.target.dataset.alunoDesafioId;
                console.log(`Clicou em concluir desafio ID (aluno_desafios): ${alunoDesafioId}`);
                alert(`Funcionalidade "Concluir Desafio" ainda não implementada no backend.`);
            });
        });
    }
    carregarDadosAluno();

});