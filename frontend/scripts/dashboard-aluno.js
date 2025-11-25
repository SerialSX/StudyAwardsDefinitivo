document.addEventListener('DOMContentLoaded', () => {

    // 1. Proteção de Rota
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);

    if (usuarioLogado.tipo !== 'ALUNO') {
        alert('Acesso negado. Esta área é apenas para alunos.');
        window.location.href = '../index.html';
        return;
    }

    // 2. Carrega todos os dados da página
    async function carregarDadosAluno() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../index.html';
            return;
        }

        try {
            const urlPontuacao = `http://localhost:3000/usuarios/${usuarioLogado.id}/pontuacao`;
            const urlRanking = `http://localhost:3000/ranking`;
            const urlDesafios = `http://localhost:3000/api/desafios?alunoId=${usuarioLogado.id}`; 
            
            const [respostaPontuacao, respostaRanking, respostaDesafios] = await Promise.all([
                fetch(urlPontuacao, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(urlRanking,   { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(urlDesafios,  { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const dadosPontuacao = await respostaPontuacao.json();
            const dadosRanking = await respostaRanking.json();
            const dadosDesafios = await respostaDesafios.json();

            // Atualiza Pontuação
            document.getElementById('pontuacao-valor').textContent = dadosPontuacao.pontuacao_total || 0;
            document.getElementById('saudacao-aluno').textContent = `Olá, ${dadosPontuacao.nome || 'Aluno'}! 👋`;

            // Atualiza Ranking
            const meuRanking = dadosRanking.ranking.findIndex(u => u.id === usuarioLogado.id) + 1;
            const totalAlunos = dadosRanking.ranking.length;
            const rankingTexto = (meuRanking > 0) ? `#${meuRanking} de ${totalAlunos}` : '--';
            
            // Procura o elemento do ranking no DOM (se existir ID específico, melhor usar ID)
            // Assumindo que é o segundo card com base no HTML que você mandou
            const rankingElements = document.querySelectorAll('.status-card .main-value');
            if(rankingElements[1]) rankingElements[1].textContent = rankingTexto;

            // Atualiza Desafios
            renderizarDesafios(dadosDesafios.desafios);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro de conexão ao carregar os dados do dashboard.');
        }
    }

    // --- FUNÇÃO DE RENDERIZAÇÃO ATUALIZADA ---
function renderizarDesafios(desafios) {
    const containerPendentes = document.getElementById('container-pendentes');
    const containerRealizadas = document.getElementById('container-realizadas');

    // Limpa os containers e aplica estilo de grid
    [containerPendentes, containerRealizadas].forEach(c => {
        if(c) {
            c.innerHTML = '';
            c.style.display = 'grid';
            // Grid responsivo: cria colunas de no mínimo 250px
            c.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
            c.style.gap = '1rem';
        }
    });

    // --- PARTE 1: FILTRAR OS DADOS ---
    // Pendentes = status 'pendente' ou 'atrasado'
    const pendentesList = desafios.filter(d => d.status === 'pendente' || d.status === 'atrasado');
    // Realizadas = status 'em_analise' ou 'concluido'
    const realizadasList = desafios.filter(d => d.status === 'em_analise' || d.status === 'concluido');


    // --- PARTE 2: RENDERIZAR PENDENTES (Igual era antes) ---
    if (pendentesList.length === 0) {
        containerPendentes.innerHTML = '<p style="color: #718096; grid-column: 1 / -1;">Nenhuma atividade pendente! 🎉</p>';
    } else {
        pendentesList.forEach(desafio => {
            const card = document.createElement('div');
            card.className = 'activity-card';
            
            // Lógica de atraso
            const prazo = new Date(desafio.prazo_final);
            const hoje = new Date();
            const atrasado = prazo < hoje && desafio.status === 'pendente';
            if(atrasado) card.style.border = '1px solid #ef4444';

            card.innerHTML = `
                <div class="card-header">
                    <h4>${desafio.titulo}</h4>
                    <span class="points-badge">+${desafio.pontos} pts</span>
                </div>
                <p>${desafio.descricao || 'Sem descrição.'}</p>
                <div class="card-footer">
                    <span class="deadline" style="${atrasado ? 'color: #ef4444; font-weight:bold;' : ''}">
                        ${atrasado ? '⚠️ Atrasado!' : 'Prazo: ' + prazo.toLocaleDateString()}
                    </span>
                    <button onclick="abrirModalEnvio(${desafio.aluno_desafio_id})" class="btn btn-primary btn-sm">
                        Enviar Atividade
                    </button>
                </div>
            `;
            containerPendentes.appendChild(card);
        });
    }

    // --- PARTE 3: RENDERIZAR REALIZADAS (Com link da foto!) ---
    if (realizadasList.length === 0) {
        containerRealizadas.innerHTML = '<p style="color: #718096; grid-column: 1 / -1;">Você ainda não entregou nenhuma atividade.</p>';
    } else {
        realizadasList.forEach(desafio => {
            const card = document.createElement('div');
            const isConcluido = desafio.status === 'concluido';
            
            // Estilo diferente se já foi aprovado (verde) ou se está em análise (amarelo)
            const bgColor = isConcluido ? '#dcfce7' : '#fffbeb'; 
            const borderColor = isConcluido ? '#22c55e' : '#fbbf24';
            
            card.style.cssText = `background: ${bgColor}; border: 1px solid ${borderColor}; padding: 1.5rem; border-radius: 12px;`;

            // Define o badge de status
            let statusBadge = '<span class="badge badge-yellow">Em Análise ⏳</span>';
            if(isConcluido) statusBadge = '<span class="badge badge-green">Concluído ✅</span>';

            // --- LÓGICA DA FOTO ---
            let htmlComprovante = '';
            if(desafio.comprovante_path) {
                // Corrige barras invertidas do Windows se necessário
                const caminhoArr = desafio.comprovante_path.split(/[/\\]/);
                // Pega só o nome do arquivo no final
                const nomeArquivo = caminhoArr[caminhoArr.length - 1];
                // Monta a URL final
                const imgUrl = `http://localhost:3000/uploads/${nomeArquivo}`;
                
                htmlComprovante = `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid ${borderColor}aa;">
                        <a href="${imgUrl}" target="_blank" style="display: flex; align-items: center; gap: 0.5rem; color: #2563eb; text-decoration: none; font-weight: 600; font-size: 0.9rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15"/></svg>
                            Ver Comprovante Enviado
                        </a>
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0; font-size: 1.1rem;">${desafio.titulo}</h4>
                    <span style="font-weight: 700; color: #2563eb;">+${desafio.pontos} pts</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        ${statusBadge}
                        <small style="color: #718096;">
                            ${desafio.data_conclusao ? new Date(desafio.data_conclusao).toLocaleDateString() : ''}
                        </small>
                </div>
                ${htmlComprovante} `;
            containerRealizadas.appendChild(card);
        });
    }
}

    // 4. Completar Desafio (COM UPLOAD)
    async function completarDesafio(alunoDesafioId, botao) {
        const token = localStorage.getItem('token');
        
        // --- MUDANÇA: Pega o arquivo do input correspondente ---
        const inputFile = document.getElementById(`arquivo-${alunoDesafioId}`);
        
        if (!inputFile || inputFile.files.length === 0) {
            alert("⚠️ Atenção: Você precisa anexar uma foto ou print para comprovar que fez a atividade!");
            return;
        }

        const file = inputFile.files[0];

        botao.disabled = true;
        botao.textContent = 'Enviando...';

        try {
            // --- MUDANÇA: Usa FormData para enviar arquivo ---
            const formData = new FormData();
            formData.append('comprovante', file); // 'comprovante' é o nome que configuramos no Multer (upload.single)

            const response = await fetch(`http://localhost:3000/api/desafios/completar/${alunoDesafioId}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`
                    // NÃO colocar Content-Type: application/json aqui, o navegador faz isso sozinho pro FormData
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ ${data.message}`); // Mensagem vinda do backend ("enviado para análise")
                
                // --- MUDANÇA: Não recarrega a página inteira, apenas atualiza o visual do card ---
                // Acha o card pai do botão
                const card = botao.closest('.activity-card');
                if (card) {
                    card.style.borderLeft = "4px solid #f59e0b"; // Muda cor para amarelo
                    // Remove o botão e o input, deixa só o texto
                    const divConteudo = card.querySelector('div'); // A div da esquerda
                    
                    // Limpa o input de arquivo para não ficar feio
                    const inputDiv = divConteudo.querySelector('div[style*="margin-top"]');
                    if(inputDiv) inputDiv.remove();

                    // Adiciona o status visual
                    divConteudo.innerHTML += `<div style="margin-top:8px;"><small style="color: #f59e0b; font-weight: bold; background: #fffbeb; padding: 4px 8px; border-radius: 4px;">Status: Em Análise 🕒</small></div>`;
                    
                    botao.remove(); // Remove o botão de enviar
                }

            } else {
                alert(`Erro: ${data.erro}`);
                botao.disabled = false;
                botao.textContent = 'Enviar';
            }
        } catch (error) {
            console.error('Erro ao completar:', error);
            alert('Erro de conexão.');
            botao.disabled = false;
            botao.textContent = 'Enviar';
        }
    }

    // Chuta o início de tudo
    carregarDadosAluno();
});