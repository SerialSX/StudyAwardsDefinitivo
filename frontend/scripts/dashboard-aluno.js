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

            if (!respostaPontuacao.ok || !respostaRanking.ok || !respostaDesafios.ok) {
                console.error('Erro nas requisições');
                alert('Erro ao carregar os dados do dashboard.');
                return;
            }

            const dadosPontuacao = await respostaPontuacao.json();
            const dadosRanking = await respostaRanking.json();
            const dadosDesafios = await respostaDesafios.json();

            // --- ATUALIZADO: Preenche Cabeçalho e ID ---
            document.getElementById('saudacao-aluno').textContent = `Olá, ${dadosPontuacao.nome}! 👋`;
            document.getElementById('id-aluno-display').textContent = usuarioLogado.id; // MOSTRA O ID AQUI
            
            // Card Pontuação
            document.getElementById('pontuacao-valor').textContent = dadosPontuacao.pontuacao_total;
            
            // Card Ranking
            const minhaPosicao = dadosRanking.ranking.findIndex(aluno => aluno.id === usuarioLogado.id) + 1;
            const totalAlunos = dadosRanking.ranking.length;
            document.getElementById('ranking-valor').textContent = minhaPosicao > 0 ? `#${minhaPosicao}` : 'N/A';
            document.getElementById('ranking-total').textContent = `/ ${totalAlunos}`;
            
            // Card Presença (Placeholder)
            document.getElementById('presenca-valor').textContent = `92%`; 

            // Preenche Atividades
            preencherAtividadesDisponiveis(dadosDesafios.desafios);

            // Preenche Meta
            const metaPontos = 1500;
            const pontuacaoAtual = dadosPontuacao.pontuacao_total;
            const progressoMeta = Math.min(Math.round((pontuacaoAtual / metaPontos) * 100), 100);
            
            const elMetaTexto = document.getElementById('meta-pontos-texto');
            const elMetaBarra = document.getElementById('meta-barra-progresso');

            if (elMetaTexto) elMetaTexto.textContent = `${pontuacaoAtual} / ${metaPontos}`;
            if (elMetaBarra) elMetaBarra.style.width = `${progressoMeta}%`;

        } catch (error) {
            console.error('Erro JS:', error);
            alert('Erro de conexão ao carregar os dados do dashboard.');
        }
    }

    // 3. Renderiza os cards de desafio
    function preencherAtividadesDisponiveis(desafios) {
        const activitiesGrid = document.querySelector('.activities-grid');
        if (!activitiesGrid) return;
        activitiesGrid.innerHTML = ''; 

        if (!desafios || desafios.length === 0) {
            activitiesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #718096;">Nenhuma atividade pendente!</p>';
            return;
        }

        desafios.forEach(desafio => {
            const card = document.createElement('div');
            card.className = 'activity-card';
            card.id = `desafio-card-${desafio.aluno_desafio_id}`; 

            if (desafio.status === 'concluido' || desafio.status === 'atrasado') {
                 card.classList.add('concluded');
            }

            let cardHTML = `
                <div>
                    <h4>${desafio.titulo}</h4>
                    <p>${desafio.descricao || 'Sem descrição'}</p> 
                </div>
            `;

            if (desafio.status === 'pendente') {
                cardHTML += `
                    <div class="activity-points">${desafio.pontos} pts</div>
                    <button class="btn btn-primary btn-small" data-aluno-desafio-id="${desafio.aluno_desafio_id}">
                        Concluir
                    </button>
                `;
            } else {
                let statusTexto = desafio.status.charAt(0).toUpperCase() + desafio.status.slice(1);
                cardHTML += `
                    <div class="activity-status" style="grid-column: 1 / -1; text-align: right; color: #4a5568; font-weight: 500;">
                        ${statusTexto} ✓
                    </div>
                `;
            }

            card.innerHTML = cardHTML;
            activitiesGrid.appendChild(card);
        });

        // Lógica do botão concluir
        activitiesGrid.querySelectorAll('.btn-primary').forEach(button => {
            button.addEventListener('click', (event) => {
                const alunoDesafioId = event.target.dataset.alunoDesafioId;
                completarDesafio(alunoDesafioId); 
            });
        });
    }

    // 4. Completar Desafio
    async function completarDesafio(alunoDesafioId) {
        const token = localStorage.getItem('token');
        const botao = document.querySelector(`button[data-aluno-desafio-id="${alunoDesafioId}"]`);
        
        if (!botao) return;
        botao.disabled = true;
        botao.textContent = '...';

        try {
            const response = await fetch(`http://localhost:3000/api/desafios/completar/${alunoDesafioId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Parabéns! +${data.pontosGanhos} pontos!`);
                location.reload(); 
            } else {
                alert(`Erro: ${data.erro}`);
                botao.disabled = false;
                botao.textContent = 'Concluir';
            }
        } catch (error) {
            console.error('Erro ao completar:', error);
            alert('Erro de conexão.');
            botao.disabled = false;
            botao.textContent = 'Concluir';
        }
    }

    carregarDadosAluno();
});