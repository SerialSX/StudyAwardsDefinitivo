// --- CONFIGURAÇÃO DA API ---
// 1. Rodando no seu PC (Teste):
// const API_URL = "http://localhost:3000"; 

// 2. Rodando na Vercel (Produção):
const API_URL = "https://studyawardsdefinitivo-production.up.railway.app"; 
// ---------------------------

document.addEventListener('DOMContentLoaded', () => {

    // 1. Proteção de Rota e Leitura de Dados
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        window.location.href = '../index.html';
        return;
    }
    
    const usuarioLogado = JSON.parse(usuarioLogadoString);

    if (usuarioLogado.tipo !== 'RESPONSAVEL') {
        alert('Acesso negado.');
        window.location.href = '../index.html';
        return;
    }

    // AQUI: Pegamos o ID que o backend mandou no passo anterior
    const alunoResponsavelId = usuarioLogado.alunoIdAssociado;

    if (!alunoResponsavelId) {
        Swal.fire({
            title: 'Erro de Vínculo',
            text: 'Não encontramos o aluno associado a esta conta. Por favor, recrie a conta informando o ID do aluno.',
            icon: 'error'
        });
        return;
    }

    async function carregarDadosResponsavel() {
        const token = localStorage.getItem('token');
        
        try {
            // USA API_URL
            const urlPontuacao = `${API_URL}/usuarios/${alunoResponsavelId}/pontuacao`;
            const urlRanking = `${API_URL}/ranking`;
            const urlDesafios = `${API_URL}/api/desafios?alunoId=${alunoResponsavelId}`;
            const urlPenalidades = `${API_URL}/alunos/${alunoResponsavelId}/penalidades`;

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
            
            preencherCabecalhoAluno(dadosAluno, dadosRanking);
            preencherStatusCards(dadosAluno, dadosDesafios.desafios, dadosPenalidades.historico);
            preencherAtividadesRecentes(dadosDesafios.desafios, dadosPenalidades.historico);
            
            // Função do Gráfico (Chart.js)
            gerarGraficoEvolucao(dadosDesafios.desafios);

            preencherProgressoMeta(dadosAluno, dadosDesafios.desafios);

        } catch (error) {
            console.error('Erro JS:', error);
            alert('Erro de conexão ao carregar dados.');
        }
    }

    function preencherCabecalhoAluno(dadosAluno, dadosRanking) {
        document.getElementById('nome-aluno').textContent = dadosAluno.nome;
        document.getElementById('serie-aluno').textContent = 'Turma 9A'; 

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
        document.getElementById('pontuacao-total').textContent = dadosAluno.pontuacao_total;

        const labelFreq = document.querySelector('.status-card:nth-child(2) h3');
        if(labelFreq) labelFreq.textContent = "Faltas Registradas";
        
        const totalFaltas = penalidades ? penalidades.length : 0;
        document.getElementById('taxa-presenca').textContent = totalFaltas; 

        const concluidas = desafios ? desafios.filter(d => d.status === 'concluido').length : 0;
        const total = desafios ? desafios.length : 0;
        document.getElementById('progresso-meta').textContent = `${concluidas} / ${total}`;
    }

    function preencherAtividadesRecentes(desafios, penalidades) {
        const lista = document.getElementById('recent-activities-list');
        if (!lista) return;
        lista.innerHTML = '';

        let eventos = [];

        if (desafios) {
            desafios.forEach(d => {
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

        eventos.sort((a, b) => b.data - a.data);
        const recentes = eventos.slice(0, 5);

        if (recentes.length === 0) {
            lista.innerHTML = '<p style="color: var(--text-secondary);">Nenhuma atividade recente.</p>';
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
                    <h4 style="margin-bottom: 0.2rem; color: var(--text-primary);">${evento.titulo}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${dataFormatada}</p>
                </div>
                ${badgeHtml}
            `;
            lista.appendChild(item);
        });
    }

    // --- GRÁFICO Chart.js (Evolução) ---
    function gerarGraficoEvolucao(desafios) {
        const ctx = document.getElementById('graficoEvolucao');
        if (!ctx) return;

        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const hoje = new Date();
        
        let labels = [];
        let dadosReais = [];
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            labels.push(meses[d.getMonth()]);
            
            const pontosDoMes = desafios
                .filter(daf => {
                    if (daf.status !== 'concluido' || !daf.data_conclusao) return false;
                    const dataConclusao = new Date(daf.data_conclusao);
                    return dataConclusao.getMonth() === d.getMonth();
                })
                .reduce((acc, curr) => acc + curr.pontos, 0);
            
            dadosReais.push(pontosDoMes);
        }

        const totalReais = dadosReais.reduce((a, b) => a + b, 0);
        if (totalReais === 0) {
            dadosReais = [50, 100, 80, 150, 120, 0]; // Simulação se vazio
        }

        if (window.meuGrafico) window.meuGrafico.destroy();

        const isDark = document.body.classList.contains('dark-mode');
        const corTexto = isDark ? '#cbd5e1' : '#64748b';
        const corGrid = isDark ? '#334155' : '#e2e8f0';

        window.meuGrafico = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pontos',
                    data: dadosReais,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2563eb',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: corGrid }, ticks: { color: corTexto } },
                    x: { grid: { display: false }, ticks: { color: corTexto } }
                }
            }
        });
    }

    function preencherProgressoMeta(dadosAluno, desafios) {
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