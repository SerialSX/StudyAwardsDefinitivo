document.addEventListener('DOMContentLoaded', () => {

    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        console.error('Nenhum usuário logado encontrado. Redirecionando para o login.');
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);

    if (usuarioLogado.tipo !== 'RESPONSAVEL') {
        console.error('Usuário logado não é um responsável. Acesso negado.');
        alert('Acesso negado. Esta área é apenas para responsáveis.');
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../index.html';
        return;
    }


    const alunoResponsavelId = usuarioLogado.alunoIdAssociado || 1;
    console.log(`Responsável logado: ${usuarioLogado.nome}, buscando dados do Aluno ID: ${alunoResponsavelId}`);

    async function carregarDadosResponsavel() {
        try {
            const urlPontuacaoAluno = `http://localhost:3000/usuarios/${alunoResponsavelId}/pontuacao`;
            const urlRanking = `http://localhost:3000/ranking`;

            const [respostaPontuacao, respostaRanking] = await Promise.all([
                fetch(urlPontuacaoAluno),
                fetch(urlRanking)
            ]);

            if (!respostaPontuacao.ok || !respostaRanking.ok) {
                console.error('Erro ao buscar dados do aluno ou ranking:', respostaPontuacao.status, respostaRanking.status);
                alert('Erro ao carregar os dados do aluno. Tente recarregar.');
                return;
            }

            const dadosAluno = await respostaPontuacao.json();
            const dadosRanking = await respostaRanking.json();

            preencherCabecalhoAluno(dadosAluno, dadosRanking);
            preencherStatusCards(dadosAluno);

            const dadosFakeResponsavel = await fetch('../data/responsavel.json').then(res => res.json());
            preencherEvolucaoDesempenho(dadosFakeResponsavel.evolucaoDesempenho); 
            preencherAtividadesRecentes(dadosFakeResponsavel.atividadesRecentes);
            preencherProgressoMeta(dadosAluno, dadosFakeResponsavel.metaPontos);

        } catch (error) {
            console.error('Erro ao carregar os dados para o responsável:', error);
            alert('Erro de conexão ao carregar dados do dashboard do responsável.');
        }
    }

    function preencherCabecalhoAluno(dadosAluno, dadosRanking) {
        document.getElementById('nome-aluno').textContent = dadosAluno.nome;
        document.getElementById('serie-aluno').textContent = '...';

        const minhaPosicao = dadosRanking.ranking.findIndex(aluno => aluno.id === dadosAluno.id) + 1;
        if (minhaPosicao > 0) {
             document.getElementById('ranking-badge').textContent = `#${minhaPosicao} no Ranking`;
        } else {
             document.getElementById('ranking-badge').textContent = `N/A no Ranking`;
        }
    }

    function preencherStatusCards(dadosAluno) {
        document.getElementById('pontuacao-total').textContent = dadosAluno.pontuacao_total;

        document.getElementById('taxa-presenca').textContent = `...%`;
        const metaPontos = 1500;
        const progressoMetaPercent = Math.round((dadosAluno.pontuacao_total / metaPontos) * 100);
        document.getElementById('progresso-meta').textContent = `${Math.min(progressoMetaPercent, 100)}%`;
    }

    function preencherEvolucaoDesempenho(evolucao) {
        const performanceChart = document.getElementById('performance-chart');
        if (!performanceChart) return;
        performanceChart.innerHTML = '';
        if (!evolucao || evolucao.length === 0) return;
        const maxPontos = Math.max(...evolucao.map(item => item.pontos), 0);
        evolucao.forEach(item => {
            const chartRow = document.createElement('div');
            chartRow.className = 'chart-row';
            const barWidth = maxPontos > 0 ? (item.pontos / maxPontos) * 100 : 0;

            chartRow.innerHTML = `
                <span class="month">${item.mes}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${barWidth}%;"></div>
                </div>
                <span class="points">${item.pontos} pts</span>
            `;
            performanceChart.appendChild(chartRow);
        });
    }

     function preencherAtividadesRecentes(atividades) {
        const listaAtividades = document.getElementById('recent-activities-list');
         if (!listaAtividades) return;
        listaAtividades.innerHTML = '';
         if (!atividades) return;

        atividades.forEach(atividade => {
            const itemLista = document.createElement('li');
            const statusClass = atividade.status === 'Pendente' ? 'pending' : 'positive';

            itemLista.innerHTML = `
                <div>
                    <h4>${atividade.nome}</h4>
                    <p>${atividade.data}</p>
                </div>
                <span class="points-badge ${statusClass}">${atividade.status}</span>
            `;
            listaAtividades.appendChild(itemLista);
        });
    }

    function preencherProgressoMeta(dadosAluno, metaPontosFake) {
        const metaPontos = metaPontosFake || 1500;
        const pontuacaoAtual = dadosAluno.pontuacao_total;
        const progressoPercent = Math.round((pontuacaoAtual / metaPontos) * 100);

        document.getElementById('meta-texto').textContent = `Meta: ${metaPontos} pontos`;
        document.getElementById('meta-progresso-texto').textContent = `${pontuacaoAtual} / ${metaPontos}`;
        const progressBar = document.getElementById('meta-progress-bar');
        progressBar.style.width = `${Math.min(progressoPercent, 100)}%`;
        const pontosFaltantes = Math.max(0, metaPontos - pontuacaoAtual);
        document.getElementById('meta-incentivo').textContent = `Seu aluno está a ${pontosFaltantes} pontos de atingir a meta! Continue incentivando!`;
    }
    carregarDadosResponsavel();
});