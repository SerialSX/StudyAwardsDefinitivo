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

    // ==========================================
    // LÓGICA DE ABAS (TABS) - O CORE DO NOVO DESIGN
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões e conteúdos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Adiciona 'active' no botão clicado
            btn.classList.add('active');
            
            // Mostra o conteúdo correspondente (ex: tab-alunos)
            const tabId = btn.dataset.tab; 
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // ==========================================
    // LÓGICA DE CARREGAMENTO DE DADOS (ALUNOS)
    // ==========================================
    async function carregarDadosProfessor() {
        const token = localStorage.getItem('token');
        try {
            // Busca a lista de alunos (usando a rota ranking)
            const res = await fetch('http://localhost:3000/ranking', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const alunos = data.ranking;

            // Atualiza os contadores do topo
            document.getElementById('total-alunos').textContent = alunos.length;
            document.getElementById('presentes-hoje').textContent = Math.floor(alunos.length * 0.9); // Fake data
            document.getElementById('atividades-ativas').textContent = "8"; // Fake data

            // Preenche a tabela da aba "Alunos"
            preencherTabelaAlunos(alunos);

        } catch (error) {
            console.error(error);
        }
    }

    function preencherTabelaAlunos(alunos) {
        const tbody = document.getElementById('tabela-alunos-body');
        tbody.innerHTML = '';

        alunos.forEach(aluno => {
            const tr = document.createElement('tr');
            
            // Gera uma frequência aleatória só pra ficar bonito na tabela
            const freq = Math.floor(Math.random() * (100 - 75) + 75); 
            let badgeClass = freq > 90 ? 'badge-green' : (freq > 80 ? 'badge-yellow' : 'badge-red');

            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: #2d3748;">${aluno.nome}</div>
                    <div style="font-size: 0.75rem; color: #718096;">Turma 3º Sem</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: #eab308;">★</span> 
                        <strong>${aluno.pontuacao_total}</strong>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${freq}%</span></td>
                <td>
                    <span class="badge badge-green" style="cursor: pointer; opacity: 0.8;">Presente</span>
                </td>
                <td>
                    <button class="btn-icon" title="Ver detalhes">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // LÓGICA DE CRIAR ATIVIDADE (NA ABA ATIVIDADES)
    // ==========================================
    const formAba = document.getElementById('form-criar-desafio-aba');
    
    if (formAba) {
        formAba.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formAba.querySelector('button');
            const textoOriginal = btn.textContent;
            
            btn.textContent = "Criando...";
            btn.disabled = true;

            // 1. Pega dados
            const titulo = document.getElementById('aba-titulo').value;
            const descricao = document.getElementById('aba-descricao').value;
            const pontos = parseInt(document.getElementById('aba-pontos').value);
            const prazo = document.getElementById('aba-prazo').value;
            
            const token = localStorage.getItem('token');
            const dadosDesafio = { 
                titulo, descricao, pontos, 
                prazo_final: prazo ? prazo : null 
            };

            try {
                // 2. Cria o desafio (API)
                const resCreate = await fetch('http://localhost:3000/api/desafios', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(dadosDesafio)
                });
                const dataCreate = await resCreate.json();

                if (resCreate.ok) {
                    // 3. Atribui a todos (API)
                    const resAssign = await fetch('http://localhost:3000/api/desafios/atribuir-todos', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ desafio_id: dataCreate.id })
                    });

                    if (resAssign.ok) {
                        alert(`Atividade "${titulo}" criada e atribuída com sucesso!`);
                        formAba.reset();
                        
                        // Adiciona na lista visual (efeito imediato)
                        const lista = document.getElementById('lista-atividades-recentes');
                        const novoItem = document.createElement('li');
                        novoItem.innerHTML = `
                            <div><h4>${titulo}</h4><p>Criada agora</p></div>
                            <span class="badge badge-gray">Nova</span>
                        `;
                        lista.prepend(novoItem);
                    }
                } else {
                    alert('Erro ao criar: ' + dataCreate.erro);
                }

            } catch (err) {
                console.error(err);
                alert('Erro de conexão.');
            } finally {
                btn.textContent = textoOriginal;
                btn.disabled = false;
            }
        });
    }

    // Inicializa
    carregarDadosProfessor();
});