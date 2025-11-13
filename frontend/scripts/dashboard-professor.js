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
    // LÓGICA DE ABAS (TABS)
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab; 
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // ==========================================
    // CARREGAR DADOS
    // ==========================================
    async function carregarDadosProfessor() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3000/ranking', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const alunos = data.ranking;

            document.getElementById('total-alunos').textContent = alunos.length;
            document.getElementById('presentes-hoje').textContent = "--"; // Placeholder
            document.getElementById('atividades-ativas').textContent = "--"; // Placeholder

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
            
            // Frequência Fake (apenas visual)
            const freq = 90; 
            let badgeClass = 'badge-green';

            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: #2d3748;">${aluno.nome}</div>
                    <div style="font-size: 0.75rem; color: #718096;">ID: ${aluno.id}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: #eab308;">★</span> 
                        <strong>${aluno.pontuacao_total}</strong>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${freq}%</span></td>
                <td>
                    <div class="presence-buttons" data-aluno-id="${aluno.id}" data-aluno-nome="${aluno.nome}">
                        <button class="badge badge-green btn-presence" style="cursor: pointer; border: 1px solid transparent;">Presente</button>
                        <button class="badge badge-red btn-absence" style="cursor: pointer; border: 1px solid transparent; opacity: 0.5;">Ausente</button>
                    </div>
                </td>
                <td>
                    <button class="btn-icon">
                       ...
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // --- LÓGICA DOS BOTÕES DE PRESENÇA (AQUI ESTÁ A MÁGICA) ---
        tbody.querySelectorAll('.presence-buttons button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const clickedButton = event.target;
                const parentDiv = clickedButton.parentElement;
                const alunoId = parentDiv.dataset.alunoId;
                const token = localStorage.getItem('token');

                // Lógica Visual (Toggle)
                const isPresenceBtn = clickedButton.classList.contains('btn-presence');
                const buttons = parentDiv.querySelectorAll('button');
                
                buttons.forEach(btn => btn.style.opacity = '0.5'); // Apaga todos
                clickedButton.style.opacity = '1'; // Acende o clicado

                if (isPresenceBtn) {
                    // 1. Clicou em PRESENTE
                    // Apenas confirmação visual, pois "Presente" é o estado normal
                    console.log(`Aluno ${alunoId} marcado como PRESENTE.`);
                } else {
                    // 2. Clicou em AUSENTE (Chama API de Penalidade)
                    const motivo = prompt("Motivo da falta (ex: Atraso, Sem justificativa):", "Falta injustificada");
                    
                    if (motivo) {
                        try {
                            const response = await fetch('http://localhost:3000/registrar-falta', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    alunoId: parseInt(alunoId),
                                    dataFalta: new Date().toISOString().split('T')[0], // Data de Hoje
                                    professorId: usuarioLogado.id,
                                    pontosDeduzidos: 10, // Tira 10 pontos
                                    motivo: motivo
                                })
                            });

                            if (response.ok) {
                                alert(`Falta registrada! -10 pontos para o aluno.`);
                                carregarDadosProfessor(); // Recarrega para atualizar os pontos na tabela
                            } else {
                                alert("Erro ao registrar falta.");
                            }
                        } catch (error) {
                            console.error("Erro:", error);
                            alert("Erro de conexão.");
                        }
                    } else {
                        // Se cancelar o prompt, reseta o visual
                        buttons.forEach(btn => btn.style.opacity = '1');
                    }
                }
            });
        });
    }

    // ==========================================
    // CRIAR ATIVIDADE (Cópia da lógica anterior)
    // ==========================================
    const formAba = document.getElementById('form-criar-desafio-aba');
    if (formAba) {
        formAba.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formAba.querySelector('button');
            btn.textContent = "Criando...";
            btn.disabled = true;

            const titulo = document.getElementById('aba-titulo').value;
            const descricao = document.getElementById('aba-descricao').value;
            const pontos = parseInt(document.getElementById('aba-pontos').value);
            const prazo = document.getElementById('aba-prazo').value;
            
            const token = localStorage.getItem('token');
            const dadosDesafio = { titulo, descricao, pontos, prazo_final: prazo ? prazo : null };

            try {
                const resCreate = await fetch('http://localhost:3000/api/desafios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(dadosDesafio)
                });
                const dataCreate = await resCreate.json();

                if (resCreate.ok) {
                    const resAssign = await fetch('http://localhost:3000/api/desafios/atribuir-todos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ desafio_id: dataCreate.id })
                    });

                    if (resAssign.ok) {
                        alert(`Atividade "${titulo}" criada e atribuída!`);
                        formAba.reset();
                        // Atualiza lista visual
                        const lista = document.getElementById('lista-atividades-recentes');
                        const novoItem = document.createElement('li');
                        novoItem.innerHTML = `<div><h4>${titulo}</h4><p>Criada agora</p></div><span class="badge badge-gray">Nova</span>`;
                        lista.prepend(novoItem);
                    }
                } else {
                    alert('Erro ao criar: ' + dataCreate.erro);
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão.');
            } finally {
                btn.textContent = "Criar Atividade e Atribuir";
                btn.disabled = false;
            }
        });
    }

    carregarDadosProfessor();
});