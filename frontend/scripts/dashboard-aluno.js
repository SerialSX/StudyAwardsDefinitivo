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

    // 2. Função Principal de Carregamento
    async function carregarDadosAluno() {
        const token = localStorage.getItem('token');
        
        try {
            // Buscamos TUDO em paralelo para ser rápido
            const [resDash, resDesafios, resPontos] = await Promise.all([
                fetch(`${API_URL}/api/dashboard/aluno`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/desafios?alunoId=${usuarioLogado.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/usuarios/${usuarioLogado.id}/pontuacao`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const dadosDash = await resDash.json();
            const dadosDesafios = await resDesafios.json();
            const dadosPontos = await resPontos.json();

            console.log("✅ Dados recebidos:", { dadosDash, dadosDesafios });

            // A. Atualizar Topo (Nome e Pontos)
            const primeiroNome = usuarioLogado.nome.split(' ')[0];
            const elSaudacao = document.getElementById('saudacao-aluno');
            if(elSaudacao) elSaudacao.textContent = `Olá, ${primeiroNome}! 👋`;
            
            const elId = document.getElementById('id-aluno-display');
            if(elId) elId.textContent = usuarioLogado.id;
            
            const elPontos = document.getElementById('pontuacao-valor');
            if(elPontos) elPontos.textContent = dadosPontos.pontuacao_total || 0;

            // B. RENDERIZAR HISTÓRICO DE PRESENÇA (Real do Banco)
            renderizarPresenca(dadosDash.historicoPresenca);

            // C. RENDERIZAR METAS (Cálculo real)
            renderizarMetas(dadosPontos.pontuacao_total || 0, dadosDash.atividadesConcluidas || 0);

            // D. RENDERIZAR DESAFIOS
            renderizarDesafios(dadosDesafios.desafios);

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
        }
    }

    function renderizarPresenca(historico) {
        const presenceGrid = document.querySelector('.presence-grid');
        if (!presenceGrid) return;

        presenceGrid.innerHTML = ''; // Limpa o "Carregando..."

        if (historico && historico.length > 0) {
            historico.forEach(registro => {
                // Formata data
                const dataObj = new Date(registro.data_aula);
                const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
                
                // Define ícone (Verde se presente, Vermelho se falta)
                const icone = registro.presente 
                    ? `<svg class="icon-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M20 6 9 17l-5-5"/></svg>`
                    : `<svg class="icon-x" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

                const div = document.createElement('div');
                div.className = 'presence-item';
                div.innerHTML = `<span class="presence-date">${dataFormatada}</span>${icone}`;
                
                presenceGrid.appendChild(div);
            });
        } else {
            presenceGrid.innerHTML = '<span style="grid-column: 1/-1; color: #94a3b8; font-size: 0.85rem; text-align: center;">Nenhum registro de aula.</span>';
        }
    }

    function renderizarMetas(pontosAtuais, atividadesFeitas) {
        const META = 1500;
        const pct = Math.min((pontosAtuais / META) * 100, 100);
        
        const elTextoMeta = document.getElementById('meta-pontos-texto');
        const elBarraMeta = document.getElementById('meta-barra-progresso');
        const elAtivTexto = document.getElementById('meta-atividades-texto');

        if(elTextoMeta) elTextoMeta.textContent = `${pontosAtuais} / ${META}`;
        if(elBarraMeta) elBarraMeta.style.width = `${pct}%`;
        if(elAtivTexto) elAtivTexto.textContent = `${atividadesFeitas} Concluídas`;
    }

    function renderizarDesafios(listaDesafios) {
        const containerPendentes = document.getElementById('container-pendentes');
        const containerRealizadas = document.getElementById('container-realizadas');

        if(containerPendentes) containerPendentes.innerHTML = '';
        if(containerRealizadas) containerRealizadas.innerHTML = '';

        if (!listaDesafios || listaDesafios.length === 0) {
            if(containerPendentes) containerPendentes.innerHTML = '<p style="grid-column: 1/-1; color:gray">Nenhuma atividade disponível.</p>';
            return;
        }

        listaDesafios.forEach(desafio => {
            const status = desafio.status || 'pendente';
            const isConcluido = status === 'concluido' || status === 'em_analise';
            
            const card = document.createElement('div');
            card.className = `activity-card ${isConcluido ? 'concluded' : ''}`;
            
            // Define o conteúdo HTML baseado no status
            if (!isConcluido) {
                // PENDENTE
                card.innerHTML = `
                    <div>
                        <h4>${desafio.titulo}</h4>
                        <p style="font-size: 0.8rem; color: #64748b;">Prazo: ${desafio.prazo_final ? new Date(desafio.prazo_final).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Sem prazo'}</p>
                    </div>
                    <div class="activity-points">+${desafio.pontos} pts</div>
                    <div style="grid-column: 1 / -1; margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center;">
                        <input type="file" id="arquivo-${desafio.aluno_desafio_id || desafio.id}" class="file-input" style="font-size: 0.8rem; width: 100%;">
                        <button class="btn btn-small btn-primary" onclick="enviarTarefaDireto(this, ${desafio.aluno_desafio_id || desafio.id})">Enviar</button>
                    </div>
                `;
                if(containerPendentes) containerPendentes.appendChild(card);

            } else {
                // CONCLUÍDO / EM ANÁLISE
                const badgeClass = status === 'concluido' ? 'badge-green' : 'badge-yellow';
                const textoStatus = status === 'concluido' ? 'Concluído ✅' : 'Em Análise ⏳';
                const corBorda = status === 'concluido' ? '#22c55e' : '#f59e0b';
                
                // Estilo inline extra para destacar
                card.style.borderLeft = `4px solid ${corBorda}`;

                let linkComprovante = '';
                if(desafio.comprovante_path) {
                    const nomeArquivo = desafio.comprovante_path.split(/[/\\]/).pop();
                    linkComprovante = `<a href="${API_URL}/uploads/${nomeArquivo}" target="_blank" style="font-size:0.8rem; color:#2563eb; text-decoration:underline; display:block; margin-top:0.5rem;">Ver Comprovante</a>`;
                }

                card.innerHTML = `
                    <div>
                        <h4>${desafio.titulo}</h4>
                        <span class="badge ${badgeClass}" style="margin-top: 0.2rem; font-size: 0.75rem;">${textoStatus}</span>
                    </div>
                    <div class="activity-points" style="opacity: 0.7;">+${desafio.pontos} pts</div>
                    <div style="grid-column: 1 / -1;">
                        ${linkComprovante}
                    </div>
                `;
                if(containerRealizadas) containerRealizadas.appendChild(card);
            }
        });
    }

    carregarDadosAluno();
});

// --- Função Global para Envio de Tarefa ---
// Precisa estar no escopo global (window) para o onclick do HTML funcionar
window.enviarTarefaDireto = async function(btn, id) {
    const API_URL = "https://studyawardsdefinitivo-production.up.railway.app";
    const input = document.getElementById(`arquivo-${id}`);
    
    if(!input || !input.files[0]) {
        Swal.fire('Atenção', 'Selecione uma imagem ou arquivo para enviar.', 'warning');
        return;
    }
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('comprovante', input.files[0]);

    const textoOriginal = btn.innerText;
    btn.innerText = "...";
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/api/desafios/completar/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const data = await res.json();
        
        if(res.ok) {
            await Swal.fire('Sucesso!', 'Atividade enviada para correção.', 'success');
            window.location.reload();
        } else {
            Swal.fire('Erro', data.erro || 'Ocorreu um erro ao enviar.', 'error');
            btn.disabled = false;
            btn.innerText = textoOriginal;
        }
    } catch(err) {
        console.error(err);
        Swal.fire('Erro de Rede', 'Verifique sua conexão.', 'error');
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
};