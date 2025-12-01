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

    // 5. Gráfico Real
    function gerarGraficoProfessor(dadosReais) {
        const ctx = document.getElementById('graficoRankingProfessor');
        if (!ctx) return;
        if (window.graficoProf) window.graficoProf.destroy();

        const labels = dadosReais && dadosReais.length ? dadosReais.map(d => d.mes) : ['Sem dados'];
        const dataPoints = dadosReais && dadosReais.length ? dadosReais.map(d => d.total_pontos) : [0];
        const isDark = document.body.classList.contains('dark-mode');
        const corTexto = isDark ? '#cbd5e1' : '#64748b';

        window.graficoProf = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pontos Totais da Turma',
                    data: dataPoints,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: corTexto } },
                    x: { ticks: { color: corTexto }, grid: { display: false } }
                },
                plugins: { legend: { display: false } }
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