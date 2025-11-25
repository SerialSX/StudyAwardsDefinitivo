document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Dashboard Aluno: Script Iniciado");

    // 1. Proteção de Rota
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        console.warn("Usuário não logado. Redirecionando...");
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);

    if (usuarioLogado.tipo !== 'ALUNO') {
        alert('Acesso negado.');
        window.location.href = '../index.html';
        return;
    }

    // 2. Carregar Dados
    async function carregarDadosAluno() {
        const token = localStorage.getItem('token');
        console.log("🔄 Buscando dados do aluno ID:", usuarioLogado.id);

        try {
            const urlPontuacao = `http://localhost:3000/usuarios/${usuarioLogado.id}/pontuacao`;
            const urlRanking = `http://localhost:3000/ranking`;
            const urlDesafios = `http://localhost:3000/api/desafios?alunoId=${usuarioLogado.id}`;
            
            const [resPontos, resRank, resDesafios] = await Promise.all([
                fetch(urlPontuacao, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(urlRanking,   { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(urlDesafios,  { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const dadosPontuacao = await resPontos.json();
            const dadosRanking = await resRank.json();
            const dadosDesafios = await resDesafios.json();

            console.log("✅ Dados recebidos:", { pontos: dadosPontuacao, desafios: dadosDesafios });

            // Atualiza Topo
            document.getElementById('pontuacao-valor').textContent = dadosPontuacao.pontuacao_total || 0;
            document.getElementById('saudacao-aluno').textContent = `Olá, ${dadosPontuacao.nome || 'Aluno'}! 👋`;
            
            // Renderiza Listas
            renderizarDesafios(dadosDesafios.desafios);

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
        }
    }

    // 3. Renderizar Cards
    function renderizarDesafios(desafios) {
        const containerPendentes = document.getElementById('container-pendentes');
        const containerRealizadas = document.getElementById('container-realizadas');

        if(containerPendentes) containerPendentes.innerHTML = '';
        if(containerRealizadas) containerRealizadas.innerHTML = '';

        // Separa as listas
        const pendentesList = desafios.filter(d => d.status === 'pendente' || d.status === 'atrasado');
        const realizadasList = desafios.filter(d => d.status === 'em_analise' || d.status === 'concluido');

        console.log(`📊 Renderizando: ${pendentesList.length} pendentes, ${realizadasList.length} realizadas.`);

        // --- PENDENTES ---
        if (!containerPendentes || pendentesList.length === 0) {
            if(containerPendentes) containerPendentes.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">Nenhuma atividade pendente! 🎉</p>';
        } else {
            pendentesList.forEach(desafio => {
                const card = document.createElement('div');
                card.className = 'activity-card';
                card.style.cssText = `
                    display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; 
                    border-radius: 12px; background-color: var(--bg-card); border: 1px solid var(--border-color);
                `;
                
                const prazo = new Date(desafio.prazo_final);
                const atrasado = prazo < new Date() && desafio.status === 'pendente';

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between;">
                        <h4 style="margin: 0; color: var(--text-primary);">${desafio.titulo}</h4>
                        <span class="badge badge-green" style="background: var(--bg-body); color: var(--primary-color); border: 1px solid var(--border-color);">+${desafio.pontos} pts</span>
                    </div>
                    <p style="color: var(--text-secondary);">${desafio.descricao || 'Sem descrição.'}</p>
                    
                    <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-primary);">Anexar Foto:</label>
                        <input type="file" id="arquivo-${desafio.aluno_desafio_id}" accept="image/*" style="width: 100%; margin-bottom: 10px;">
                        
                        <button onclick="enviarTarefaDireto(this, ${desafio.aluno_desafio_id})" class="btn btn-primary" style="width: 100%;">
                            Enviar Atividade
                        </button>
                    </div>
                `;
                containerPendentes.appendChild(card);
            });
        }

        // --- REALIZADAS ---
        if (!containerRealizadas || realizadasList.length === 0) {
            if(containerRealizadas) containerRealizadas.innerHTML = '<p style="color: var(--text-secondary);">Nenhuma atividade entregue.</p>';
        } else {
            realizadasList.forEach(desafio => {
                const card = document.createElement('div');
                const isConcluido = desafio.status === 'concluido';
                const corStatus = isConcluido ? '#22c55e' : '#f59e0b';
                
                card.style.cssText = `
                    padding: 1.5rem; border-radius: 12px; background-color: var(--bg-card); 
                    border: 1px solid var(--border-color); border-left: 4px solid ${corStatus};
                `;

                let linkFoto = desafio.comprovante_path ? `http://localhost:3000/uploads/${desafio.comprovante_path.split(/[/\\]/).pop()}` : '';

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <h4 style="color: var(--text-primary); margin:0;">${desafio.titulo}</h4>
                        <span style="font-weight:bold; color: ${corStatus}; font-size: 0.85rem;">
                            ${isConcluido ? 'Concluído ✅' : 'Em Análise ⏳'}
                        </span>
                    </div>
                    ${linkFoto ? `<a href="${linkFoto}" target="_blank" style="color: var(--primary-color); font-size: 0.9rem; text-decoration: underline;">Ver Comprovante</a>` : ''}
                `;
                containerRealizadas.appendChild(card);
            });
        }
    }

    carregarDadosAluno();
});

// --- FUNÇÃO GLOBAL DE ENVIO (IMPORTANTE: TEM QUE FICAR FORA DO DOMContentLoaded) ---
window.enviarTarefaDireto = async function(btn, id) {
    console.log(`🖱️ Botão clicado para desafio ID: ${id}`);

    const input = document.getElementById(`arquivo-${id}`);
    
    if(!input || !input.files[0]) {
        console.warn("⚠️ Nenhum arquivo selecionado.");
        alert("⚠️ Por favor, selecione uma imagem antes de enviar.");
        return;
    }
    
    console.log("📁 Arquivo selecionado:", input.files[0].name);

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('comprovante', input.files[0]);

    btn.textContent = "Enviando...";
    btn.disabled = true;

    try {
        const res = await fetch(`http://localhost:3000/api/desafios/completar/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        
        if(res.ok) {
            console.log("✅ Sucesso no envio:", data);
            alert("✅ Atividade enviada com sucesso!");
            window.location.reload();
        } else {
            console.error("❌ Erro do servidor:", data);
            alert("Erro: " + data.erro);
            btn.disabled = false;
            btn.textContent = "Enviar Atividade";
        }
    } catch(err) {
        console.error("❌ Erro de rede:", err);
        alert("Erro de conexão.");
        btn.disabled = false;
        btn.textContent = "Enviar Atividade";
    }
};