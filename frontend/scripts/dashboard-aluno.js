/* frontend/scripts/dashboard-aluno.js */

// --- CONFIGURAÇÃO DA API (Produção Railway) ---
const API_URL = "https://studyawardsdefinitivo-production.up.railway.app"; 

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Dashboard Aluno: Iniciando...");

    // 1. Proteção de Rota
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);

    if (usuarioLogado.tipo !== 'ALUNO') {
        alert('Acesso negado.');
        window.location.href = '../index.html';
        return;
    }

    // Visual Imediato (Cache)
    if (usuarioLogado) {
        const primeiroNome = usuarioLogado.nome ? usuarioLogado.nome.split(' ')[0] : 'Aluno';
        const elSaudacao = document.getElementById('saudacao-aluno');
        const elId = document.getElementById('id-aluno-display');
        if (elSaudacao) elSaudacao.textContent = `Olá, ${primeiroNome}! 👋`;
        if (elId) elId.textContent = usuarioLogado.id;
    }

    // 2. Carregar Dados Reais
    async function carregarDadosAluno() {
        const token = localStorage.getItem('token');
        
        try {
            // Buscamos TUDO (Dashboard, Desafios, Pontos, Ranking)
            const [resDash, resDesafios, resPontos, resRanking] = await Promise.all([
                fetch(`${API_URL}/api/dashboard/aluno`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/desafios?alunoId=${usuarioLogado.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/usuarios/${usuarioLogado.id}/pontuacao`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/ranking`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const dadosDash = await resDash.json();
            const dadosDesafios = await resDesafios.json();
            const dadosPontos = await resPontos.json();
            const dadosRanking = await resRanking.json();

            // A. Atualiza Pontos
            const elPontos = document.getElementById('pontuacao-valor');
            if(elPontos) elPontos.textContent = dadosPontos.pontuacao_total || 0;

            // B. PROCESSA O RANKING (Calcula posição e ativa clique)
            processarRanking(dadosRanking.ranking, usuarioLogado.id);

            // C. ATUALIZA A FREQUÊNCIA (Número e Barra)
            // Se o backend mandou a %, usa. Se não, calcula aqui mesmo.
            let freqPercentual = 100;
            
            if (dadosDash.frequenciaPercentual !== undefined) {
                freqPercentual = dadosDash.frequenciaPercentual;
            } else if (dadosDash.historicoPresenca) {
                // Fallback: Se o backend não mandou o total calculado, estimamos pelas últimas
                const faltasVisiveis = dadosDash.historicoPresenca.filter(h => !h.presente).length;
                // Exemplo simples: cada falta visível tira 5% apenas para ilustrar, se o back falhar
                if (faltasVisiveis > 0) freqPercentual = Math.max(0, 100 - (faltasVisiveis * 5)); 
            }

            const elFrequencia = document.getElementById('presenca-valor');
            if (elFrequencia) elFrequencia.textContent = `${freqPercentual}%`;
            
            // Atualiza a barra de progresso da frequência se existir
            const elBarraFreq = document.getElementById('barra-frequencia-fill');
            if (elBarraFreq) elBarraFreq.style.width = `${freqPercentual}%`;


            // D. Renderiza Listas
            renderizarPresenca(dadosDash.historicoPresenca);
            renderizarMetas(dadosPontos.pontuacao_total || 0, dadosDash.atividadesConcluidas || 0);
            renderizarDesafios(dadosDesafios.desafios);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    // --- FUNÇÃO DE RANKING E POP-UP ---
    function processarRanking(listaRanking, meuId) {
        if (!listaRanking || listaRanking.length === 0) return;

        // Acha minha posição
        const minhaPosicao = listaRanking.findIndex(aluno => aluno.id === meuId) + 1;
        const totalAlunos = listaRanking.length;

        const elPosicao = document.getElementById('ranking-valor');
        const elTotal = document.getElementById('ranking-total');

        if (elPosicao) elPosicao.textContent = `# ${minhaPosicao > 0 ? minhaPosicao : '-'}`;
        if (elTotal) elTotal.textContent = `/ ${totalAlunos}`;

        // Ativa o clique no card verde
        const cardRanking = document.querySelector('.card-green');
        if (cardRanking) {
            cardRanking.style.cursor = 'pointer';
            cardRanking.onclick = () => mostrarTopRanking(listaRanking);
        }
    }

    function mostrarTopRanking(lista) {
        const top5 = lista.slice(0, 5).map((a, index) => {
            const medalha = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `#${index+1}`));
            return `
                <div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #eee;">
                    <span>${medalha} <strong>${a.nome}</strong></span>
                    <span style="color:#2563eb; font-weight:bold;">${a.pontuacao_total} pts</span>
                </div>
            `;
        }).join('');

        Swal.fire({
            title: '🏆 Top 5 da Turma',
            html: `<div style="text-align:left; margin-top:10px;">${top5}</div>`,
            confirmButtonText: 'Fechar'
        });
    }

    function renderizarPresenca(historico) {
        const presenceGrid = document.querySelector('.presence-grid');
        if (!presenceGrid) return;
        presenceGrid.innerHTML = ''; 

        if (historico && historico.length > 0) {
            historico.forEach(registro => {
                const dataObj = new Date(registro.data_aula || registro.data_falta);
                const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
                
                const icone = `<svg class="icon-x" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

                const div = document.createElement('div');
                div.className = 'presence-item';
                div.innerHTML = `<span class="presence-date" style="color:red; font-size:0.8rem">${dataFormatada}</span>${icone}`;
                presenceGrid.appendChild(div);
            });
        } else {
            presenceGrid.innerHTML = '<span style="grid-column: 1/-1; color: #16a34a; font-size: 0.9rem; text-align: center;">Nenhuma falta recente.</span>';
        }
    }

    function renderizarMetas(pontos, concluidas) {
        const META = 1500;
        const pct = Math.min((pontos / META) * 100, 100);
        
        const elTextoMeta = document.getElementById('meta-pontos-texto');
        const elBarraMeta = document.getElementById('meta-barra-progresso');
        const elAtivTexto = document.getElementById('meta-atividades-texto');

        if(elTextoMeta) elTextoMeta.textContent = `${pontos} / ${META}`;
        if(elBarraMeta) elBarraMeta.style.width = `${pct}%`;
        if(elAtivTexto) elAtivTexto.textContent = `${concluidas} Concluídas`;
    }

    function renderizarDesafios(lista) {
        const pendentes = document.getElementById('container-pendentes');
        const realizadas = document.getElementById('container-realizadas');

        if(pendentes) pendentes.innerHTML = '';
        if(realizadas) realizadas.innerHTML = '';

        if (!lista || lista.length === 0) {
            if(pendentes) pendentes.innerHTML = '<p style="color:gray">Nenhuma atividade disponível.</p>';
            return;
        }

        lista.forEach(d => {
            const isConcluido = d.status === 'concluido' || d.status === 'em_analise';
            const card = document.createElement('div');
            card.className = 'activity-card';
            
            if (!isConcluido) {
                card.innerHTML = `
                    <div>
                        <h4>${d.titulo}</h4>
                        <p style="font-size: 0.8rem; color: #64748b;">Prazo: ${d.prazo_final ? new Date(d.prazo_final).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Sem prazo'}</p>
                    </div>
                    <div class="activity-points">+${d.pontos} pts</div>
                    <div style="grid-column: 1 / -1; margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center;">
                        <input type="file" id="arquivo-${d.aluno_desafio_id || d.id}" class="file-input" style="font-size: 0.8rem; width: 100%;">
                        <button class="btn btn-primary btn-small" onclick="enviarTarefaDireto(this, ${d.aluno_desafio_id || d.id})">Enviar</button>
                    </div>
                `;
                if(pendentes) pendentes.appendChild(card);
            } else {
                const corStatus = d.status === 'concluido' ? '#22c55e' : '#f59e0b';
                const txtStatus = d.status === 'concluido' ? 'Concluído' : 'Em Análise';
                card.style.borderLeft = `4px solid ${corStatus}`;
                card.style.padding = '1rem';
                card.style.backgroundColor = 'var(--bg-card)'; 

                let linkComprovante = '';
                if(d.comprovante_path) {
                    const nomeArquivo = d.comprovante_path.split(/[/\\]/).pop();
                    linkComprovante = `<a href="${API_URL}/uploads/${nomeArquivo}" target="_blank" style="font-size:0.8rem; color:#2563eb; text-decoration:underline; display:block; margin-top:0.5rem;">Ver Comprovante</a>`;
                }

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <h4>${d.titulo}</h4>
                        <span style="color:${corStatus}; font-weight:bold; font-size:0.8rem;">${txtStatus}</span>
                    </div>
                    ${linkComprovante}
                `;
                if(realizadas) realizadas.appendChild(card);
            }
        });
    }

    carregarDadosAluno();
});

window.enviarTarefaDireto = async function(btn, id) {
    const API_URL = "https://studyawardsdefinitivo-production.up.railway.app"; 
    const input = document.getElementById(`arquivo-${id}`);
    if(!input.files[0]) { alert('Selecione um arquivo!'); return; }

    const formData = new FormData();
    formData.append('comprovante', input.files[0]);
    const token = localStorage.getItem('token');

    btn.textContent = "..."; btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/api/desafios/completar/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if(res.ok) { alert('Enviado!'); window.location.reload(); }
        else { alert('Erro ao enviar'); btn.disabled = false; btn.textContent = "Enviar"; }
    } catch(e) { alert('Erro de conexão'); btn.disabled = false; btn.textContent = "Enviar"; }
};