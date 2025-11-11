document.addEventListener('DOMContentLoaded', () => {

    //Não deixa os usuarios logarem em tipos não cadastrados
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        console.error('Nenhum usuário logado encontrado. Redirecionando para o login.');
        window.location.href = '../index.html';
        return;
    }
    const usuarioLogado = JSON.parse(usuarioLogadoString);

    if (usuarioLogado.tipo !== 'ALUNO') {
        console.error('Usuário logado não é um aluno. Acesso negado.');
        alert('Acesso negado. Esta área é apenas para alunos.');
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../index.html';
        return;
    }

    // Carrega dados da página
    async function carregarDadosAluno() {
        const token = localStorage.getItem('token');
        if (!token) {

             // Sem token não vai
            window.location.href = '../index.html';
            return;
        }

        try {
            const urlPontuacao = `http://localhost:3000/usuarios/${usuarioLogado.id}/pontuacao`;
            const urlRanking = `http://localhost:3000/ranking`;

            // Busca os desafios para aluno 
            const urlDesafios = `http://localhost:3000/api/desafios?alunoId=${usuarioLogado.id}`; 
            
            const [respostaPontuacao, respostaRanking, respostaDesafios] = await Promise.all([
                fetch(urlPontuacao, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(urlRanking,   { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(urlDesafios,  { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!respostaPontuacao.ok || !respostaRanking.ok || !respostaDesafios.ok) {
                console.error('Erro ao buscar dados do backend:', respostaPontuacao.status, respostaRanking.status, respostaDesafios.status);
                alert('Erro ao carregar os dados do dashboard. Tente recarregar a página.');
                return;
            }

            const dadosPontuacao = await respostaPontuacao.json();
            const dadosRanking = await respostaRanking.json();
            const dadosDesafios = await respostaDesafios.json();

            // Preenche o cabeçalho
            document.getElementById('saudacao-aluno').textContent = `Olá, ${dadosPontuacao.nome}!`;
            document.getElementById('pontuacao-valor').textContent = dadosPontuacao.pontuacao_total;
            
            // Preenche o ranking
            const minhaPosicao = dadosRanking.ranking.findIndex(aluno => aluno.id === usuarioLogado.id) + 1;
            const totalAlunos = dadosRanking.ranking.length;
            if (minhaPosicao > 0) {
                document.getElementById('ranking-valor').textContent = `#${minhaPosicao}`;
                document.getElementById('ranking-total').textContent = `de ${totalAlunos} alunos`;
            } else {
                document.getElementById('ranking-valor').textContent = `N/A`;
                document.getElementById('ranking-total').textContent = `de ${totalAlunos} alunos`;
            }
            document.getElementById('presenca-valor').textContent = `...%`; 

            // Preenche a lista de desafios
            preencherAtividadesDisponiveis(dadosDesafios.desafios);

            // Preenche a meta
            const metaPontos = 1500;
            const progressoMeta = Math.round((dadosPontuacao.pontuacao_total / metaPontos) * 100);
            document.querySelector('.progress-info span:nth-child(2)').textContent = `${dadosPontuacao.pontuacao_total} / ${metaPontos} pontos`;
            document.querySelector('.progress-bar').style.width = `${Math.min(progressoMeta, 100)}%`;
            document.querySelector('.meta-description').textContent = `Você está a ${Math.max(0, metaPontos - dadosPontuacao.pontuacao_total)} pontos de atingir sua meta!`;

        } catch (error) {
            console.error('Erro ao carregar os dados do aluno:', error);
            alert('Erro de conexão ao carregar os dados do dashboard.');
        }
    }

    //Mostra os cards de desafio
    function preencherAtividadesDisponiveis(desafios) {
        const activitiesGrid = document.querySelector('.activities-grid');
        if (!activitiesGrid) return;
        activitiesGrid.innerHTML = ''; // Limpa Lista

        if (!desafios || desafios.length === 0) {
            activitiesGrid.innerHTML = '<p>Nenhum desafio disponível no momento.</p>';
            return;
        }

        desafios.forEach(desafio => {
            const card = document.createElement('div');
            card.className = 'activity-card';
            card.id = `desafio-card-${desafio.aluno_desafio_id}`; // ID para atualizar o card depois do clique

            if (desafio.status === 'concluido' || desafio.status === 'atrasado') {
                 card.classList.add('concluded');
            }

            let cardHTML = `
                <div>
                    <h4>${desafio.titulo}</h4>
                    <p>${desafio.descricao || 'Sem descrição'}</p> 
                </div>
            `;

            // Mostra o botão ou o status, dependendo do desafio
            if (desafio.status === 'pendente') {
                cardHTML += `
                    <div class="activity-points">${desafio.pontos} pts</div>
                    <button class="btn btn-primary btn-small" data-aluno-desafio-id="${desafio.aluno_desafio_id}">
                        Marcar como Concluído
                    </button>
                `;
            } else {
                let statusTexto = desafio.status.charAt(0).toUpperCase() + desafio.status.slice(1);
                cardHTML += `
                    <div class="activity-status" style="grid-column: 1 / -1; text-align: right; color: #4a5568; font-weight: 500;">
                        Status: ${statusTexto} ✓
                    </div>
                `;
            }

            card.innerHTML = cardHTML;
            activitiesGrid.appendChild(card);
        });

        //Event par botão completar desafio
        activitiesGrid.querySelectorAll('.btn-primary').forEach(button => {
            button.addEventListener('click', (event) => {
                const alunoDesafioId = event.target.dataset.alunoDesafioId;
                completarDesafio(alunoDesafioId); 
            });
        });
    }

    // Lógica para completarDesafio 
    async function completarDesafio(alunoDesafioId) {
        const token = localStorage.getItem('token');
        const botao = document.querySelector(`button[data-aluno-desafio-id="${alunoDesafioId}"]`);
        const card = document.getElementById(`desafio-card-${alunoDesafioId}`);

        if (!botao || !card) return;

        botao.disabled = true;
        botao.textContent = 'Enviando...';

        try {
            // Chama a API de completar desafio
            const response = await fetch(`http://localhost:3000/api/desafios/completar/${alunoDesafioId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Desafio concluído! Você ganhou +${data.pontosGanhos} pontos!`);

                // Atualiza o card sem recarregar a página
                card.classList.add('concluded');
                card.innerHTML = `
                    <div>
                        <h4>${card.querySelector('h4').textContent}</h4>
                        <p>${card.querySelector('p').textContent}</p> 
                    </div>
                    <div class="activity-status" style="grid-column: 1 / -1; text-align: right; color: #4a5568; font-weight: 500;">
                        Status: Concluído ✓
                    </div>
                `;
                
                // Atualiza a pontuação total na tela
                const pontuacaoEl = document.getElementById('pontuacao-valor');
                const pontuacaoAtual = parseInt(pontuacaoEl.textContent);
                pontuacaoEl.textContent = pontuacaoAtual + data.pontosGanhos;

            } else {
                // Erro da API 
                alert(`Erro: ${data.erro}`);
                botao.disabled = false;
                botao.textContent = 'Marcar como Concluído';
            }
        } catch (error) {
            // Erro de rede
            console.error('Erro de rede ao completar desafio:', error);
            alert('Erro de conexão. Tente novamente.');
            botao.disabled = false;
            botao.textContent = 'Marcar como Concluído';
        }
    }

    // Chuta o início de tudo
    carregarDadosAluno();
});