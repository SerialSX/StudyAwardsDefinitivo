const API_URL = "https://studyawardsdefinitivo-production.up.railway.app"; 

document.addEventListener('DOMContentLoaded', () => {

    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) { window.location.href = '../index.html'; return; }
    const usuarioLogado = JSON.parse(usuarioLogadoString);
    if (usuarioLogado.tipo !== 'PROFESSOR') { alert('Acesso negado.'); window.location.href = '../index.html'; return; }

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // --- LÓGICA PARA CRIAR NOVA ATIVIDADE (IDs Corrigidos) ---
    const formCriar = document.getElementById('form-criar-desafio-aba');

    if (formCriar) {
        formCriar.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede a página de recarregar
            
            // Pegando os valores pelos IDs corretos do seu HTML
            const titulo = document.getElementById('aba-titulo').value;
            const descricao = document.getElementById('aba-descricao').value;
            const pontos = document.getElementById('aba-pontos').value;
            const prazo = document.getElementById('aba-prazo').value;
            
            const token = localStorage.getItem('token');

            // Feedback visual imediato (Opcional, mas bom para UX)
            const btnSubmit = formCriar.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerText;
            btnSubmit.innerText = "Enviando...";
            btnSubmit.disabled = true;

            try {
                const response = await fetch(`${API_URL}/api/desafios`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        titulo, 
                        descricao, 
                        pontos: parseInt(pontos), 
                        prazo_final: prazo 
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire('Sucesso!', data.message || 'Atividade enviada para a turma.', 'success');
                    formCriar.reset(); // Limpa os campos
                    carregarDadosProfessor(); // Atualiza a lista de recentes
                } else {
                    Swal.fire('Erro', data.erro || 'Falha ao criar atividade', 'error');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Erro', 'Erro de conexão com o servidor.', 'error');
            } finally {
                // Restaura o botão
                btnSubmit.innerText = textoOriginal;
                btnSubmit.disabled = false;
            }
        });
    } else {
        console.error("ERRO: Formulário 'form-criar-desafio-aba' não encontrado no HTML.");
    }

    async function carregarDadosProfessor() {
        const token = localStorage.getItem('token');
        try {
            const resDash = await fetch(`${API_URL}/api/dashboard/professor`, { headers: { 'Authorization': `Bearer ${token}` } });
            
            if (resDash.ok) {
                const dados = await resDash.json();
                
                // --- ATUALIZAÇÃO DOS CARDS (COM FREQUÊNCIA) ---
                document.getElementById('total-alunos').textContent = dados.resumo.totalAlunos || 0;
                document.getElementById('presentes-hoje').textContent = dados.resumo.presentesHoje || 0;
                document.getElementById('atividades-ativas').textContent = dados.resumo.atividadesAtivas || 0;
                // Aqui entra a % real
                document.getElementById('media-turma-valor').textContent = `${dados.resumo.frequencia || 0}%`;

                const listaRecentes = document.getElementById('lista-atividades-recentes');
                if (listaRecentes) {
                    listaRecentes.innerHTML = ''; 
                    if (!dados.atividadesRecentes || dados.atividadesRecentes.length === 0) {
                        listaRecentes.innerHTML = '<li><div style="padding:1rem; color:gray; text-align:center">Nenhuma atividade entregue recentemente.</div></li>';
                    } else {
                        dados.atividadesRecentes.forEach(ativ => {
                            const statusIcon = ativ.status === 'concluido' ? '✅' : '⏳';
                            const dataFormatada = new Date(ativ.data_conclusao).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                            const li = document.createElement('li');
                            li.innerHTML = `<div><h4 style="font-size: 0.9rem; margin-bottom: 0.2rem;">${ativ.titulo} <span style="font-weight:normal; font-size:0.8rem; color:var(--text-secondary)">(${ativ.nome_aluno})</span></h4><p style="font-size: 0.75rem; color: var(--text-secondary);">Entregue em: ${dataFormatada}</p></div><span style="font-size: 1.2rem;">${statusIcon}</span>`;
                            listaRecentes.appendChild(li);
                        });
                    }
                }
                gerarGraficoProfessor(dados.dadosGrafico);
            }

            const resRanking = await fetch(`${API_URL}/ranking`, { headers: { 'Authorization': `Bearer ${token}` } });
            const dataRanking = await resRanking.json();
            preencherTabelaAlunos(dataRanking.ranking);

        } catch (error) { console.error("Erro ao carregar dashboard:", error); }
    }

    function preencherTabelaAlunos(alunos) {
        const tbody = document.getElementById('tabela-alunos-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        alunos.forEach(aluno => {
            const tr = document.createElement('tr');
            const totalFaltas = parseInt(aluno.total_faltas || 0);
            const freq = Math.round(((200 - totalFaltas) / 200) * 100);
            let badgeClass = freq < 75 ? 'badge-red' : (freq < 85 ? 'badge-yellow' : 'badge-green');
            tr.innerHTML = `
                <td><div style="font-weight: 600; color: var(--text-primary);">${aluno.nome}</div><div style="font-size: 0.75rem; color: var(--text-secondary);">ID: ${aluno.id}</div></td>
                <td><div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #eab308;">★</span> <strong style="color: var(--text-primary);">${aluno.pontuacao_total}</strong></div></td>
                <td><span class="badge ${badgeClass}">${freq}%</span></td>
                <td><div class="presence-buttons" data-aluno-id="${aluno.id}" data-aluno-nome="${aluno.nome}"><button class="badge badge-green btn-presence" style="cursor: pointer; border: 1px solid transparent;">P</button><button class="badge badge-red btn-absence" style="cursor: pointer; border: 1px solid transparent;">F</button></div></td>
                <td><button class="btn-icon" onclick="abrirAcoesAluno(${aluno.id}, '${aluno.nome}')">...</button></td>
            `;
            tbody.appendChild(tr);
        });
        ativarBotoesPresenca();
    }

    function ativarBotoesPresenca() {
        document.querySelectorAll('.btn-absence').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const div = e.target.closest('.presence-buttons');
                const alunoId = div.dataset.alunoId;
                const nomeAluno = div.dataset.alunoNome;
                const token = localStorage.getItem('token');
                const { value: motivo } = await Swal.fire({ title: `Registrar Falta: ${nomeAluno}`, input: 'text', inputPlaceholder: 'Motivo', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Registrar' });
                if (motivo) {
                    try {
                        await fetch(`${API_URL}/registrar-falta`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ alunoId, dataFalta: new Date().toISOString(), professorId: usuarioLogado.id, pontosDeduzidos: 10, motivo }) });
                        Swal.fire('Sucesso', 'Falta registrada.', 'success');
                        carregarDadosProfessor();
                    } catch (err) { Swal.fire('Erro', 'Falha ao registrar.', 'error'); }
                }
            });
        });
        document.querySelectorAll('.btn-presence').forEach(btn => { btn.addEventListener('click', () => { const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 }); Toast.fire({ icon: 'success', title: 'Presença Confirmada' }); }); });
    }

    function gerarGraficoProfessor(dadosRaw) {
        const ctx = document.getElementById('graficoRankingProfessor');
        if (!ctx) return;
        if (window.graficoProf) window.graficoProf.destroy();
        const isDark = document.body.classList.contains('dark-mode');
        const corTexto = isDark ? '#cbd5e1' : '#64748b';
        const corGrid = isDark ? '#334155' : '#e2e8f0';
        const labels = Array.from(new Set(dadosRaw.map(d => d.mes)));
        const alunosMap = {};
        dadosRaw.forEach(d => {
            if (!alunosMap[d.nome]) alunosMap[d.nome] = { label: d.nome, data: [], tension: 0.4, borderWidth: 3 };
            alunosMap[d.nome].data.push(parseInt(d.pontos));
        });
        const cores = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#db2777'];
        const datasets = Object.values(alunosMap).map((dataset, index) => {
            const cor = cores[index % cores.length];
            return { ...dataset, borderColor: cor, backgroundColor: cor, pointRadius: 4, fill: false };
        });
        if (datasets.length === 0) { labels.push('Sem dados'); datasets.push({ label: 'Nenhuma atividade', data: [0] }); }
        window.graficoProf = new Chart(ctx, { type: 'line', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: corGrid }, ticks: { color: corTexto } }, x: { grid: { display: false }, ticks: { color: corTexto } } }, plugins: { legend: { display: true, labels: { color: corTexto } } } } });
    }

    window.abrirAcoesAluno = async (id, nome) => {
        await Swal.fire({
            title: `Gerenciar: ${nome}`,
            html: `<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    <button id="btn-historico" class="swal2-confirm swal2-styled" style="background-color: #2563eb; width: 100%; margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1rem;">📜 Ver Histórico</button>
                    <button id="btn-frequencia" class="swal2-confirm swal2-styled" style="background-color: #9333ea; width: 100%; margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1rem;">📅 Relatório Frequência</button>
                    <button id="btn-perfil" class="swal2-confirm swal2-styled" style="background-color: #4b5563; width: 100%; margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1rem;">👤 Ver Perfil</button>
                </div>`,
            showConfirmButton: false, showCloseButton: true,
            didOpen: () => {
                document.getElementById('btn-historico').onclick = () => { Swal.close(); verHistoricoAluno(id, nome); };
                document.getElementById('btn-frequencia').onclick = () => { Swal.close(); verFrequenciaAluno(id, nome); };
                document.getElementById('btn-perfil').onclick = () => { Swal.close(); verPerfilAluno(id, nome); };
            }
        });
    };

    async function verFrequenciaAluno(id, nome) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/dashboard/professor/aluno/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const f = data.frequencia;
        Swal.fire({ title: `Frequência: ${nome}`, html: `<div style="text-align:center; margin: 1rem 0;"><h2 style="color:${f.porcentagem >= 75 ? '#16a34a' : '#ef4444'}; font-size:3rem; margin:0;">${f.porcentagem}%</h2><p style="color:gray">Presença Global</p><hr><p>✅ <strong>${f.presencas}</strong> Presenças</p><p>❌ <strong>${f.faltas}</strong> Faltas</p></div>`, confirmButtonText: 'Voltar' });
    }
    async function verPerfilAluno(id, nome) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/dashboard/professor/aluno/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const a = data.aluno;
        Swal.fire({ title: 'Perfil do Aluno', html: `<div style="text-align:left"><p><strong>Nome:</strong> ${a.nome}</p><p><strong>Email:</strong> ${a.email}</p><p><strong>Pontuação:</strong> <span style="color:#eab308; font-weight:bold">${a.pontuacao_total} pts</span></p></div>`, confirmButtonText: 'OK' });
    }
    async function verHistoricoAluno(id, nome) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/desafios?alunoId=${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        let html = '<p style="color:gray; margin-top:1rem;">Nenhuma atividade.</p>';
        if (data.desafios && data.desafios.length > 0) {
            const listItems = data.desafios.map(d => {
                const status = d.status === 'concluido' ? '✅' : (d.status === 'pendente' ? '⏳' : '❌');
                return `<li style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #eee;"><strong>${d.titulo}</strong> <br> <span style="font-size:0.85rem; color:gray">${d.pontos}pts - ${status}</span></li>`;
            }).join('');
            html = `<ul style="text-align:left; padding-left:0; list-style:none;">${listItems}</ul>`;
        }
        Swal.fire({ title: `Histórico: ${nome}`, html: html, confirmButtonText: 'Fechar' });
    }

    // --- FUNÇÃO DE CORREÇÃO (Adicione isto ao final do seu arquivo) ---

    async function carregarCorrecoes() {
        const listaCorrecoes = document.getElementById('lista-correcoes');
        if (!listaCorrecoes) return;

        const token = localStorage.getItem('token');

        try {
            // Busca as tarefas pendentes na rota que já existe no seu backend
            const response = await fetch(`${API_URL}/api/desafios/pendentes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            // Limpa o texto "Carregando..."
            listaCorrecoes.innerHTML = ''; 

            if (data.entregas && data.entregas.length > 0) {
                
                data.entregas.forEach(entrega => {
                    // Cria o card visual da entrega
                    const div = document.createElement('div');
                    // Estilo inline básico para garantir que fique bonito mesmo sem CSS extra
                    div.style.cssText = "background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;";
                    
                    div.innerHTML = `
                        <div>
                            <h4 style="margin: 0; color: #1e293b; font-size: 0.95rem;">${entrega.titulo_desafio}</h4>
                            <p style="margin: 4px 0 0; font-size: 0.85rem; color: #64748b;">
                                Aluno: <strong>${entrega.nome_aluno}</strong>
                            </p>
                            ${entrega.comprovante_path ? 
                                `<a href="${API_URL}/${entrega.comprovante_path}" target="_blank" style="display:inline-block; margin-top:5px; font-size: 0.8rem; color: #2563eb; text-decoration: underline;">📎 Ver Comprovante/Foto</a>` 
                                : '<span style="font-size:0.8rem; color:gray; display:block; margin-top:5px;">Sem anexo</span>'}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-acao btn-aprovar" data-id="${entrega.aluno_desafio_id}" style="background: #22c55e; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight:500; font-size:0.8rem;">✅ Aprovar</button>
                            <button class="btn-acao btn-rejeitar" data-id="${entrega.aluno_desafio_id}" style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight:500; font-size:0.8rem;">❌ Rejeitar</button>
                        </div>
                    `;
                    listaCorrecoes.appendChild(div);
                });

                // Ativa os cliques dos botões que acabamos de criar
                configurarBotoesAvaliacao();

            } else {
                listaCorrecoes.innerHTML = '<div style="text-align:center; padding: 2rem; color: #94a3b8;">✅ Tudo limpo! Nenhuma tarefa pendente.</div>';
            }
        } catch (error) {
            console.error("Erro ao carregar correções:", error);
            listaCorrecoes.innerHTML = '<p style="color: #ef4444; text-align: center;">Erro ao carregar tarefas.</p>';
        }
    }

    function configurarBotoesAvaliacao() {
        // Remove listeners antigos para evitar duplicação e adiciona novos
        const botoes = document.querySelectorAll('.btn-acao');
        botoes.forEach(btn => {
            btn.onclick = async (e) => {
                const id = e.target.dataset.id;
                const aprovado = e.target.classList.contains('btn-aprovar');
                
                // Pergunta de confirmação
                const confirmacao = await Swal.fire({
                    title: aprovado ? 'Aprovar tarefa?' : 'Rejeitar tarefa?',
                    text: aprovado ? "O aluno receberá os pontos imediatamente." : "A tarefa voltará para o aluno refazer.",
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: aprovado ? '#22c55e' : '#ef4444',
                    confirmButtonText: aprovado ? 'Sim, aprovar!' : 'Rejeitar'
                });

                if (confirmacao.isConfirmed) {
                    enviarAvaliacao(id, aprovado);
                }
            };
        });
    }

    async function enviarAvaliacao(id, aprovado) {
        const token = localStorage.getItem('token');
        try {
            // Chama a rota de avaliação do seu backend
            const res = await fetch(`${API_URL}/api/desafios/avaliar/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ aprovado })
            });

            if (res.ok) {
                Swal.fire('Feito!', aprovado ? 'Tarefa aprovada!' : 'Tarefa rejeitada.', 'success');
                carregarCorrecoes(); // Recarrega a lista para sumir com o item
                carregarDadosProfessor(); // Atualiza os gráficos/resumo lá em cima
            } else {
                Swal.fire('Erro', 'Não foi possível completar a ação.', 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Erro de conexão.', 'error');
        }
    }

    carregarDadosProfessor();
    carregarCorrecoes();
});