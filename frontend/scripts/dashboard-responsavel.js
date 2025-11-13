document.addEventListener('DOMContentLoaded', () => {

    // 1. Proteção de Rota
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        console.error('Ninguém logado. Voltando pro login.');
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);

    if (usuarioLogado.tipo !== 'RESPONSAVEL') {
        alert('Acesso negado. Esta área é apenas para responsáveis.');
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../index.html';
        return;
    }

    const alunoResponsavelId = usuarioLogado.alunoIdAssociado;
    if (!alunoResponsavelId) {
        alert("Erro: Nenhum aluno vinculado. Verifique o cadastro.");
        return;
    }

    async function carregarDadosResponsavel() {
        const token = localStorage.getItem('token');
        
        try {
            // URLs das APIs Reais
            const urlPontuacao = `http://localhost:3000/usuarios/${alunoResponsavelId}/pontuacao`;
            const urlRanking = `http://localhost:3000/ranking`;
            const urlDesafios = `http://localhost:3000/api/desafios?alunoId=${alunoResponsavelId}`;
            const urlPenalidades = `http://localhost:3000/alunos/${alunoResponsavelId}/penalidades`;

            // Busca tudo em paralelo
            const [resPontos, resRank, resDesafios, resPenalidades] = await Promise.all([
                fetch(urlPontuacao, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(urlRanking, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(urlDesafios, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(urlPenalidades, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!resPontos.ok || !resRank.ok || !resDesafios.ok) {
                console.error('Erro em uma das APIs.');
                return;
            }

            const dadosAluno = await resPontos.json();
            const dadosRanking = await resRank.json();
            const dadosDesafios = await resDesafios.json();
            const dadosPenalidades = resPenalidades.ok ? await resPenalidades.json() : { historico: [] };

            // --- PROCESSAMENTO DE DADOS REAIS ---
            
            // 1. Cabeçalho
            preencherCabecalhoAluno(dadosAluno, dadosRanking);

            // 2. Cards de Status (Agora com Faltas Reais)
            preencherStatusCards(dadosAluno, dadosDesafios.desafios, dadosPenalidades.historico);

            // 3. Lista Combinada (Atividades + Penalidades)
            preencherAtividadesRecentes(dadosDesafios.desafios, dadosPenalidades.historico);

            // 4. Gráfico Real (Calculado a partir das conclusões)
            gerarGraficoEvolucao(dadosDesafios.desafios);

            // 5. Metas
            preencherProgressoMeta(dadosAluno, dadosDesafios.desafios);

        } catch (error) {
            console.error('Erro JS:', error);
            alert('Erro de conexão ao carregar dados.');
        }
    }

    function preencherCabecalhoAluno(dadosAluno, dadosRanking) {
        document.getElementById('nome-aluno').textContent = dadosAluno.nome;
        document.getElementById('serie-aluno').textContent = 'Turma 9A'; // Placeholder (não temos Turma no banco ainda)

        const idAlunoNum = parseInt(dadosAluno.id);
        const minhaPosicao = dadosRanking.ranking.findIndex(aluno => aluno.id === idAlunoNum) + 1;
        
        const badge = document.getElementById('ranking-badge');
        if (minhaPosicao > 0) {
             badge.textContent = `#${minhaPosicao} no Ranking`;
        } else {
             badge.textContent = `N/A no Ranking`;
        }
    }

    function preencherStatusCards(dadosAluno, desafios, penalidades) {
        // Pontuação
        document.getElementById('pontuacao-total').textContent = dadosAluno.pontuacao_total;

        // Frequência -> Virou "Faltas" (Dado Real)
        // Mudamos o texto do label via JS para fazer sentido com os dados que temos
        const labelFreq = document.querySelector('.status-card:nth-child(2) h3');
        if(labelFreq) labelFreq.textContent = "Faltas Registradas";
        
        const totalFaltas = penalidades ? penalidades.length : 0;
        document.getElementById('taxa-presenca').textContent = totalFaltas; // Mostra número absoluto

        // Atividades
        const concluidas = desafios ? desafios.filter(d => d.status === 'concluido').length : 0;
        const total = desafios ? desafios.length : 0;
        document.getElementById('progresso-meta').textContent = `${concluidas} / ${total}`;
    }

    function preencherAtividadesRecentes(desafios, penalidades) {
        const lista = document.getElementById('recent-activities-list');
        if (!lista) return;
        lista.innerHTML = '';

        // Cria uma lista unificada de eventos
        let eventos = [];

        // Adiciona Desafios
        if (desafios) {
            desafios.forEach(d => {
                // Usa data de conclusão ou prazo ou hoje
                let dataEvento = d.data_conclusao || d.prazo_final || new Date().toISOString();
                eventos.push({
                    tipo: 'desafio',
                    titulo: d.titulo,
                    pontos: d.pontos,
                    status: d.status,
                    data: new Date(dataEvento),
                    original: d
                });
            });
        }

        // Adiciona Penalidades
        if (penalidades) {
            penalidades.forEach(p => {
                eventos.push({
                    tipo: 'penalidade',
                    titulo: p.motivo,
                    pontos: p.pontos_deduzidos,
                    status: 'penalidade',
                    data: new Date(p.data),
                    original: p
                });
            });
        }

        // Ordena por data (mais recente primeiro) e pega os 5 últimos
        eventos.sort((a, b) => b.data - a.data);
        const recentes = eventos.slice(0, 5);

        if (recentes.length === 0) {
            lista.innerHTML = '<p style="color: #718096;">Nenhuma atividade recente.</p>';
            return;
        }

        recentes.forEach(evento => {
            const item = document.createElement('li');
            
            let badgeHtml = '';
            let dataFormatada = evento.data.toLocaleDateString('pt-BR');

            if (evento.tipo === 'penalidade') {
                badgeHtml = `<span class="badge badge-red">-${evento.pontos} pts</span>`;
            } else if (evento.status === 'concluido') {
                badgeHtml = `<span class="badge badge-green">+${evento.pontos} pts</span>`;
            } else if (evento.status === 'atrasado') {
                badgeHtml = `<span class="badge badge-red">Atrasado</span>`;
            } else {
                badgeHtml = `<span class="badge badge-yellow">Pendente</span>`;
            }

            item.innerHTML = `
                <div>
                    <h4 style="margin-bottom: 0.2rem;">${evento.titulo}</h4>
                    <p style="font-size: 0.75rem;">${dataFormatada}</p>
                </div>
                ${badgeHtml}
            `;
            lista.appendChild(item);
        });
    }

    function gerarGraficoEvolucao(desafios) {
        const chartContainer = document.getElementById('performance-chart');
        if (!chartContainer) return;
        chartContainer.innerHTML = '';

        // Agrupa pontos ganhos por mês (apenas concluídos)
        const pontosPorMes = {};
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        // Inicializa os últimos 4 meses com 0
        const hoje = new Date();
        for (let i = 3; i >= 0; i--) {
            let d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            let key = `${meses[d.getMonth()]}`;
            pontosPorMes[key] = 0;
        }

        if (desafios) {
            desafios.forEach(d => {
                if (d.status === 'concluido' && d.data_conclusao) {
                    let data = new Date(d.data_conclusao);
                    let key = `${meses[data.getMonth()]}`;
                    // Soma se o mês estiver no nosso gráfico
                    if (pontosPorMes.hasOwnProperty(key)) {
                        pontosPorMes[key] += d.pontos;
                    }
                }
            });
        }

        // Renderiza o gráfico
        const valores = Object.values(pontosPorMes);
        const maxVal = Math.max(...valores, 100); // Escala mínima de 100

        Object.keys(pontosPorMes).forEach(mes => {
            const pontos = pontosPorMes[mes];
            const porcentagem = (pontos / maxVal) * 100;
            
            const row = document.createElement('div');
            row.className = 'chart-row';
            row.innerHTML = `
                <span class="month">${mes}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${porcentagem}%;"></div>
                </div>
                <span class="points">${pontos} pts</span>
            `;
            chartContainer.appendChild(row);
        });
        
        // Atualiza o resumo
        document.querySelector('.chart-summary').textContent = 
            `Pontos ganhos nos últimos 4 meses com base em atividades concluídas.`;
    }

    function preencherProgressoMeta(dadosAluno) {
        const metaPontos = 1500; 
        const pontuacaoAtual = dadosAluno.pontuacao_total;
        const progressoPercent = Math.round((pontuacaoAtual / metaPontos) * 100);

        document.getElementById('meta-texto').textContent = `Meta: ${metaPontos} pts`;
        document.getElementById('meta-progresso-texto').textContent = `${pontuacaoAtual} / ${metaPontos}`;
        
        const progressBar = document.getElementById('meta-progress-bar');
        if(progressBar) {
            progressBar.style.width = `${Math.min(progressoPercent, 100)}%`;
        }
        
        const pontosFaltantes = Math.max(0, metaPontos - pontuacaoAtual);
        const msg = pontosFaltantes > 0 
            ? `Faltam ${pontosFaltantes} pontos. Incentive seu filho!` 
            : `Meta batida! Parabéns pelo desempenho! 🎉`;
        
        document.getElementById('meta-incentivo').textContent = msg;
    }

    carregarDadosResponsavel();
});