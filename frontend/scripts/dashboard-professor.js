/* frontend/scripts/dashboard-professor.js */

// --- CONFIGURAÇÃO DA API (Produção Railway) ---
const API_URL = "https://studyawardsdefinitivo-production.up.railway.app"; 

document.addEventListener('DOMContentLoaded', () => {

    // 1. Proteção de Rota
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);
    if (usuarioLogado.tipo !== 'PROFESSOR') {
        alert('Acesso negado.');
        window.location.href = '../index.html';
        return;
    }

    // 2. Lógica de Abas (Tabs)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove classe active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Adiciona no clicado
            btn.classList.add('active');
            const tabId = btn.dataset.tab; 
            const tabContent = document.getElementById(`tab-${tabId}`);
            if(tabContent) tabContent.classList.add('active');
        });
    });

    // 3. Função Principal: Carregar Dados
    async function carregarDadosProfessor() {
        const token = localStorage.getItem('token');
        try {
            // A. Busca o Painel Geral (Resumo + Gráfico + Atividades)
            const resDash = await fetch(`${API_URL}/api/dashboard/professor`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (resDash.ok) {
                const dados = await resDash.json();
                
                // --- PREENCHE OS CARDS DO TOPO ---
                document.getElementById('total-alunos').textContent = dados.resumo.totalAlunos || 0;
                document.getElementById('presentes-hoje').textContent = dados.resumo.presentesHoje || 0;
                document.getElementById('atividades-ativas').textContent = dados.resumo.atividadesAtivas || 0;

                // --- PREENCHE A LISTA DE ATIVIDADES RECENTES (A CORREÇÃO ESTÁ AQUI) ---
                const listaRecentes = document.getElementById('lista-atividades-recentes');
                if (listaRecentes) {
                    listaRecentes.innerHTML = ''; // Limpa o "Carregando..."
                    
                    if (!dados.atividadesRecentes || dados.atividadesRecentes.length === 0) {
                        listaRecentes.innerHTML = '<li><div style="padding:1rem; color:gray; text-align:center">Nenhuma atividade entregue recentemente.</div></li>';
                    } else {
                        dados.atividadesRecentes.forEach(ativ => {
                            const statusIcon = ativ.status === 'concluido' ? '✅' : '⏳';
                            const dataFormatada = new Date(ativ.data_conclusao).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                            
                            const li = document.createElement('li');
                            li.innerHTML = `
                                <div>
                                    <h4 style="font-size: 0.9rem; margin-bottom: 0.2rem;">
                                        ${ativ.titulo} 
                                        <span style="font-weight:normal; font-size:0.8rem; color:var(--text-secondary)">(${ativ.nome_aluno})</span>
                                    </h4>
                                    <p style="font-size: 0.75rem; color: var(--text-secondary);">Entregue em: ${dataFormatada}</p>
                                </div>
                                <span style="font-size: 1.2rem;">${statusIcon}</span>
                            `;
                            listaRecentes.appendChild(li);
                        });
                    }
                }

                // --- GERA O GRÁFICO REAL ---
                gerarGraficoProfessor(dados.dadosGrafico);
            }

            // B. Busca e Preenche a Tabela de Alunos (Ranking)
            const resRanking = await fetch(`${API_URL}/ranking`, { headers: { 'Authorization': `Bearer ${token}` } });
            const dataRanking = await resRanking.json();
            preencherTabelaAlunos(dataRanking.ranking);

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        }
    }

    // 4. Funções da Tabela de Alunos
    function preencherTabelaAlunos(alunos) {
        const tbody = document.getElementById('tabela-alunos-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        alunos.forEach(aluno => {
            const tr = document.createElement('tr');
            
            // Estimativa de frequência baseada nas faltas
            const totalFaltas = parseInt(aluno.total_faltas || 0);
            const diasLetivos = 200; 
            const freq = Math.round(((diasLetivos - totalFaltas) / diasLetivos) * 100);
            
            let badgeClass = 'badge-green';
            if(freq < 75) badgeClass = 'badge-red';
            else if(freq < 85) badgeClass = 'badge-yellow';

            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${aluno.nome}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">ID: ${aluno.id}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: #eab308;">★</span> 
                        <strong style="color: var(--text-primary);">${aluno.pontuacao_total}</strong>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${freq}%</span></td>
                <td>
                    <div class="presence-buttons" data-aluno-id="${aluno.id}" data-aluno-nome="${aluno.nome}">
                        <button class="badge badge-green btn-presence" style="cursor: pointer; border: 1px solid transparent;">P</button>
                        <button class="badge badge-red btn-absence" style="cursor: pointer; border: 1px solid transparent;">F</button>
                    </div>
                </td>
                <td>
                    <button class="btn-icon" onclick="abrirAcoesAluno(${aluno.id}, '${aluno.nome}')">...</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        ativarBotoesPresenca();
    }

    function ativarBotoesPresenca() {
        // Botão Falta (F)
        document.querySelectorAll('.btn-absence').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const div = e.target.closest('.presence-buttons');
                const alunoId = div.dataset.alunoId;
                const nomeAluno = div.dataset.alunoNome;
                const token = localStorage.getItem('token');

                const { value: motivo } = await Swal.fire({
                    title: `Registrar Falta: ${nomeAluno}`,
                    input: 'text',
                    inputPlaceholder: 'Motivo (Ex: Atraso)',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'Registrar'
                });

                if (motivo) {
                    try {
                        await fetch(`${API_URL}/registrar-falta`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ 
                                alunoId, 
                                dataFalta: new Date().toISOString(), 
                                professorId: usuarioLogado.id, 
                                pontosDeduzidos: 10, 
                                motivo 
                            })
                        });
                        Swal.fire('Registrado', 'Falta lançada.', 'success');
                        carregarDadosProfessor(); // Atualiza os contadores
                    } catch (err) {
                        Swal.fire('Erro', 'Falha ao registrar.', 'error');
                    }
                }
            });
        });

        // Botão Presença (P) - Apenas visual
        document.querySelectorAll('.btn-presence').forEach(btn => {
            btn.addEventListener('click', () => {
                const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                Toast.fire({ icon: 'success', title: 'Presença OK' });
            });
        });
    }


  // --- GRÁFICO DE LINHAS (EVOLUÇÃO POR ALUNO) ---
    function gerarGraficoProfessor(dadosRaw) {
        const ctx = document.getElementById('graficoRankingProfessor');
        if (!ctx) return;
        
        if (window.graficoProf) window.graficoProf.destroy();

        const isDark = document.body.classList.contains('dark-mode');
        const corTexto = isDark ? '#cbd5e1' : '#64748b';
        const corGrid = isDark ? '#334155' : '#e2e8f0';

        // 1. Extrair Labels (Meses únicos)
        // Set remove duplicatas, Array.from converte de volta para array
        const labels = Array.from(new Set(dadosRaw.map(d => d.mes)));

        // 2. Agrupar dados por Aluno
        const alunosMap = {};
        dadosRaw.forEach(d => {
            if (!alunosMap[d.nome]) {
                alunosMap[d.nome] = { label: d.nome, data: [], tension: 0.4, borderWidth: 3 };
            }
            // Encontra o índice do mês e coloca o valor lá
            // (Lógica simplificada: assume ordem cronológica vinda do banco)
            alunosMap[d.nome].data.push(parseInt(d.pontos));
        });

        // 3. Gerar Cores para cada linha (Paleta Neon/Moderna)
        const cores = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#db2777'];
        const datasets = Object.values(alunosMap).map((dataset, index) => {
            const cor = cores[index % cores.length]; // Cicla as cores
            return {
                ...dataset,
                borderColor: cor,
                backgroundColor: cor,
                pointRadius: 4,
                fill: false
            };
        });

        // Se não tiver dados, cria um placeholder vazio
        if (datasets.length === 0) {
            labels.push('Sem dados');
            datasets.push({ label: 'Nenhuma atividade', data: [0] });
        }

        window.graficoProf = new Chart(ctx, {
            type: 'line', // VOLTOU PARA LINHA
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: corGrid, borderDash: [5, 5] },
                        ticks: { color: corTexto } 
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { color: corTexto } 
                    }
                },
                plugins: { 
                    legend: { 
                        display: true, // Legenda volta a aparecer para identificar o aluno
                        labels: { color: corTexto, boxWidth: 12 } 
                    } 
                }
            }
        });
    }

    // 6. Ações Extras (Menu "...")
    window.abrirAcoesAluno = async (id, nome) => {
        const { value: opcao } = await Swal.fire({
            title: `Gerenciar: ${nome}`,
            input: 'select',
            inputOptions: {
                'historico': '📜 Ver Histórico',
                'frequencia': '📅 Frequência',
                'perfil': '👤 Perfil'
            },
            showCancelButton: true
        });

        if (opcao === 'historico') verHistoricoAluno(id, nome);
        else if (opcao === 'frequencia') verFrequenciaAluno(id, nome);
        else if (opcao === 'perfil') verPerfilAluno(id, nome);
    };

    // Funções dos Modais (Buscam do Backend)
    async function verFrequenciaAluno(id, nome) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/dashboard/professor/aluno/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const f = data.frequencia;
        Swal.fire({
            title: `Frequência: ${nome}`,
            html: `<h3>${f.porcentagem}%</h3><p>✅ ${f.presencas} Presenças | ❌ ${f.faltas} Faltas</p>`
        });
    }

    async function verPerfilAluno(id, nome) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/dashboard/professor/aluno/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const a = data.aluno;
        Swal.fire({ title: 'Perfil', html: `<p><strong>Email:</strong> ${a.email}</p><p><strong>Pontos:</strong> ${a.pontuacao_total}</p>` });
    }
    
    async function verHistoricoAluno(id, nome) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/desafios?alunoId=${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        
        const lista = data.desafios.map(d => `<li>${d.titulo}: ${d.pontos}pts (${d.status})</li>`).join('');
        Swal.fire({ title: `Histórico: ${nome}`, html: `<ul style="text-align:left">${lista || 'Sem atividades'}</ul>` });
    }

    // Inicializa
    carregarDadosProfessor();
});