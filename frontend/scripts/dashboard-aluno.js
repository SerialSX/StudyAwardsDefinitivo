/* frontend/scripts/dashboard-aluno.js */

// --- CONFIGURAÇÃO DA API (Produção Railway) ---
const API_URL = "https://studyawardsdefinitivo-production.up.railway.app"; 

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Dashboard Aluno: Iniciando...");

    // 1. Proteção de Rota e Leitura de Dados Locais
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

    // --- CORREÇÃO IMEDIATA (VISUAL) ---
    // Preenche o nome e ID agora mesmo, usando o que está salvo no navegador
    // (Não espera a API responder para mostrar isso)
    if (usuarioLogado) {
        // Pega o primeiro nome ou usa 'Aluno' se estiver vazio
        const primeiroNome = usuarioLogado.nome ? usuarioLogado.nome.split(' ')[0] : 'Aluno';
        
        // Atualiza os elementos na tela
        const elSaudacao = document.getElementById('saudacao-aluno');
        const elId = document.getElementById('id-aluno-display');
        
        if (elSaudacao) elSaudacao.textContent = `Olá, ${primeiroNome}! 👋`;
        if (elId) elId.textContent = usuarioLogado.id;
    }
    // ----------------------------------

    // 2. Carregar Dados Reais do Backend (Presença, Notas, Desafios)
    async function carregarDadosAluno() {
        const token = localStorage.getItem('token');
        
        try {
            // Buscamos TUDO em paralelo
            const [resDash, resDesafios, resPontos] = await Promise.all([
                fetch(`${API_URL}/api/dashboard/aluno`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/desafios?alunoId=${usuarioLogado.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/usuarios/${usuarioLogado.id}/pontuacao`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const dadosDash = await resDash.json();
            const dadosDesafios = await resDesafios.json();
            const dadosPontos = await resPontos.json();

            // A. Atualiza Pontos (O nome e ID já foram preenchidos acima)
            const elPontos = document.getElementById('pontuacao-valor');
            if(elPontos) elPontos.textContent = dadosPontos.pontuacao_total || 0;

            // B. Renderiza Presença
            renderizarPresenca(dadosDash.historicoPresenca);

            // C. Renderiza Metas
            renderizarMetas(dadosPontos.pontuacao_total || 0, dadosDash.atividadesConcluidas || 0);

            // D. Renderiza Desafios
            renderizarDesafios(dadosDesafios.desafios);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    // --- FUNÇÕES DE DESENHO (Visual) ---

    function renderizarPresenca(historico) {
        const presenceGrid = document.querySelector('.presence-grid');
        if (!presenceGrid) return;
        presenceGrid.innerHTML = ''; 

        if (historico && historico.length > 0) {
            historico.forEach(registro => {
                const dataObj = new Date(registro.data_aula || registro.data_falta);
                // Ajuste de fuso horário simples
                const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
                
                // Ícone de Falta (X Vermelho)
                const icone = `<svg class="icon-x" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

                const div = document.createElement('div');
                div.className = 'presence-item';
                div.innerHTML = `<span class="presence-date" style="color:#ef4444; font-size:0.8rem">${dataFormatada}</span>${icone}`;
                presenceGrid.appendChild(div);
            });
        } else {
            presenceGrid.innerHTML = '<span style="grid-column: 1/-1; color: #16a34a; font-size: 0.9rem; text-align: center;">Nenhuma falta registrada! 🎉</span>';
        }
    }

    function renderizarMetas(pontos, concluidas) {
        const META = 1500;
        const pct = Math.min((pontos / META) * 100, 100);
        document.getElementById('meta-pontos-texto').textContent = `${pontos} / ${META}`;
        document.getElementById('meta-barra-progresso').style.width = `${pct}%`;
        document.getElementById('meta-atividades-texto').textContent = `${concluidas} Concluídas`;
    }

    function renderizarDesafios(lista) {
        const pendentes = document.getElementById('container-pendentes');
        const realizadas = document.getElementById('container-realizadas'); // Se existir no HTML

        if(pendentes) pendentes.innerHTML = '';
        if(realizadas) realizadas.innerHTML = '';

        if (!lista || lista.length === 0) {
            if(pendentes) pendentes.innerHTML = '<p style="color:gray">Nenhuma atividade.</p>';
            return;
        }

        lista.forEach(d => {
            const isConcluido = d.status === 'concluido' || d.status === 'em_analise';
            
            const card = document.createElement('div');
            card.className = 'activity-card';
            
            if (!isConcluido) {
                // Pendente
                card.innerHTML = `
                    <div><h4>${d.titulo}</h4><p>Valendo: ${d.pontos} pts</p></div>
                    <div style="margin-top:1rem; display:flex; gap:0.5rem;">
                        <input type="file" id="arquivo-${d.aluno_desafio_id}" style="font-size:0.8rem; width:100%">
                        <button class="btn btn-primary btn-small" onclick="enviarTarefaDireto(this, ${d.aluno_desafio_id})">Enviar</button>
                    </div>
                `;
                if(pendentes) pendentes.appendChild(card);
            } else {
                // Realizada
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

// --- FUNÇÃO GLOBAL DE ENVIO ---
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