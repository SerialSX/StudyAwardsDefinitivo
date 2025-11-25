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

    function renderizarDesafios(desafios) {
        const activitiesGrid = document.querySelector('.grid-card'); // Ajuste o seletor se necessário, baseando-se no seu HTML
        
        // Limpa o conteúdo atual (mas mantém o título se houver)
        // O ideal é ter um container específico para a lista. 
        // Vou assumir que você vai criar ou limpar a lista existente.
        // No seu HTML original, a estrutura era um pouco diferente, vou recriar a lista aqui.
        
        // Procura se já existe uma lista, se não, cria ou limpa o container de atividades
        let listaContainer = document.querySelector('.activities-list-container');
        if (!listaContainer) {
            // Se não tiver container específico, usamos o grid-card das atividades disponíveis
            // Nota: Baseado no seu HTML, as atividades ficavam na segunda section .grid-card
            const sections = document.querySelectorAll('.grid-card');
            const activitySection = sections[1]; // A segunda section é a de atividades
            if (activitySection) {
                activitySection.innerHTML = `
                    <h3>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        Atividades Disponíveis
                    </h3>
                    <div class="activities-list-container" style="display: grid; gap: 1rem; margin-top: 1rem;"></div>
                `;
                listaContainer = activitySection.querySelector('.activities-list-container');
            }
        }
        
        if (!listaContainer) return;
        listaContainer.innerHTML = ''; // Limpa

        if (desafios.length === 0) {
            listaContainer.innerHTML = '<p style="color: #718096;">Nenhum desafio pendente no momento.</p>';
            return;
        }

        desafios.forEach(desafio => {
            const card = document.createElement('div');
            card.className = 'activity-card'; 
            // Estilo inline para garantir o visual do card
            card.style.cssText = "background: white; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #2563eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;";

            // Filtra visualmente baseado no status
            if (desafio.status === 'concluido') {
                // Se já estiver concluído, nem mostra ou mostra diferente (sua lógica antiga não mostrava)
                return; 
            }
            
            // Se estiver EM ANÁLISE
            if (desafio.status === 'em_analise') {
                 card.style.borderLeft = "4px solid #f59e0b"; // Amarelo
                 card.innerHTML = `
                    <div>
                        <h4 style="font-size: 1.1rem; font-weight: 600; color: #2d3748;">${desafio.titulo}</h4>
                        <p style="color: #718096; font-size: 0.9rem; margin-top: 0.25rem;">${desafio.descricao || 'Sem descrição'}</p>
                        <small style="color: #f59e0b; font-weight: bold;">Aguardando Aprovação 🕒</small>
                    </div>
                 `;
                 listaContainer.appendChild(card);
                 return;
            }

            // --- MUDANÇA NO HTML DO CARD: Campo de Arquivo Adicionado ---
            card.innerHTML = `
                <div>
                    <h4 style="font-size: 1.1rem; font-weight: 600; color: #2d3748;">${desafio.titulo}</h4>
                    <p style="color: #718096; font-size: 0.9rem; margin-top: 0.25rem;">${desafio.descricao || 'Sem descrição'}</p>
                    <small style="color: #2563eb; font-weight: bold;">Valendo: ${desafio.pontos} pts</small>
                    
                    <div style="margin-top: 10px;">
                        <label style="font-size: 0.8rem; display: block; color: #4a5568; margin-bottom: 4px;">Comprovante (Foto/Print):</label>
                        <input type="file" id="arquivo-${desafio.aluno_desafio_id}" accept="image/*" style="font-size: 0.85rem;">
                    </div>
                </div>
                
                <button class="btn btn-primary btn-sm" data-aluno-desafio-id="${desafio.aluno_desafio_id}" style="height: fit-content;">
                    Enviar
                </button>
            `;
            
            listaContainer.appendChild(card);
        });

        // Adiciona os eventos nos botões gerados
        listaContainer.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (event) => {
                const alunoDesafioId = event.target.dataset.alunoDesafioId;
                completarDesafio(alunoDesafioId, event.target); 
            });
        });
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