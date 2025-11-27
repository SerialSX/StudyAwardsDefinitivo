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
            // 1. BUSCAR O RESUMO (Números dos Cards)
            const resResumo = await fetch('http://localhost:3000/api/professor/resumo', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (resResumo.ok) {
                const dados = await resResumo.json();
                
                // Atualiza os números na tela
                // (Certifique-se que os IDs no HTML são: 'total-alunos', 'presentes-hoje', 'atividades-ativas')
                const elTotal = document.getElementById('total-alunos');
                const elPresentes = document.getElementById('presentes-hoje');
                const elAtivas = document.getElementById('atividades-ativas');

                if(elTotal) elTotal.textContent = dados.totalAlunos || 0;
                if(elPresentes) elPresentes.textContent = dados.presentesHoje || 0;
                if(elAtivas) elAtivas.textContent = dados.atividadesAtivas || 0;
            }

            // 2. BUSCAR O RANKING (Para a tabela) - Isso já existia no seu código
            const resRanking = await fetch('http://localhost:3000/ranking', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataRanking = await resRanking.json();
            
            // ... (resto do seu código que preenche a tabela) ...
            preencherTabelaAlunos(dataRanking.ranking);
            gerarGraficoProfessor(dataRanking.ranking);

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
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

    async function carregarCorrecoes() {
    const token = localStorage.getItem('token');
    const divLista = document.getElementById('lista-correcoes');

    // 1. Pede pro backend a lista de pendentes
    const res = await fetch('http://localhost:3000/api/desafios/pendentes', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    // 2. Limpa a div
    divLista.innerHTML = '';

    if (!data.entregas || data.entregas.length === 0) {
        divLista.innerHTML = '<p>Nenhuma tarefa pendente. Tudo em dia! 😎</p>';
        return;
    }

    // 3. Cria um card para cada entrega
    data.entregas.forEach(entrega => {
        // Arruma o link da imagem
        const imgUrl = `http://localhost:3000/${entrega.comprovante_path}`;

        const card = document.createElement('div');
        card.style.cssText = "background: white; padding: 10px; margin-top: 10px; border-radius: 8px; border: 1px solid #ddd;";
        
        card.innerHTML = `
            <strong>Aluno: ${entrega.nome_aluno}</strong> <br>
            Tarefa: ${entrega.titulo_desafio} (${entrega.pontos} pts) <br>
            <a href="${imgUrl}" target="_blank" style="color: blue; text-decoration: underline;">Ver Foto</a>
            <br><br>
            <button onclick="avaliar(${entrega.aluno_desafio_id}, true)" style="background: green; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">Aprovar ✅</button>
            <button onclick="avaliar(${entrega.aluno_desafio_id}, false)" style="background: red; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">Rejeitar ❌</button>
        `;
        divLista.appendChild(card);
    });
}

// Função que os botões chamam
window.avaliar = async (id, aprovou) => {
    const token = localStorage.getItem('token');
    
    // Pergunta
    const confirmacao = await Swal.fire({
        title: aprovou ? 'Aprovar?' : 'Rejeitar?',
        text: aprovou ? "Dar os pontos ao aluno?" : "Devolver para refazer?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: aprovou ? '#16a34a' : '#ef4444',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacao.isConfirmed) return;

    try {
        const res = await fetch(`http://localhost:3000/api/desafios/avaliar/${id}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ aprovado: aprovou })
        });

        // 1. O PULO DO GATO: Lê o JSON sempre
        const data = await res.json();

        if (res.ok) {
            await Swal.fire('Sucesso!', data.message, 'success');
            carregarCorrecoes(); 
        } else {
            // 2. USA O SEU ERROR HANDLER: Mostra a mensagem real do backend
            Swal.fire('Ops!', data.erro || 'Erro desconhecido no servidor.', 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Erro de Rede', 'Não foi possível conectar ao servidor.', 'error');
    }
};

// Chama a função assim que abrir a tela
carregarCorrecoes();
});

// --- FUNÇÃO AUXILIAR: GERA COR ALEATÓRIA NEON ---
    function gerarCorAleatoria() {
        // Gera cores vivas (evita cores muito escuras para não sumir no fundo preto)
        const r = Math.floor(Math.random() * 155) + 100; // 100 a 255
        const g = Math.floor(Math.random() * 155) + 100;
        const b = Math.floor(Math.random() * 155) + 100;
        return `rgba(${r}, ${g}, ${b}, 1)`;
    }

// --- FUNÇÃO AUXILIAR: GERA COR NEON ---
    function gerarCorAleatoria() {
        const r = Math.floor(Math.random() * 155) + 100;
        const g = Math.floor(Math.random() * 155) + 100;
        const b = Math.floor(Math.random() * 155) + 100;
        return `rgba(${r}, ${g}, ${b}, 1)`;
    }

    // --- FUNÇÃO AUXILIAR: SIMULA HISTÓRICO DE CRESCIMENTO ---
    // Cria 5 pontos anteriores aleatórios que sobem até a nota real
    function gerarHistorico(notaFinal) {
        let pontos = [];
        let acumulado = 0;
        // Gera 5 pontos progressivos
        for (let i = 0; i < 5; i++) {
            // Sobe um pouquinho aleatório (entre 0 e 20% da nota final)
            let incremento = Math.floor(Math.random() * (notaFinal * 0.2));
            acumulado += incremento;
            // Garante que não ultrapasse a nota final antes da hora
            if (acumulado > notaFinal) acumulado = notaFinal - 10; 
            pontos.push(acumulado);
        }
        pontos.push(notaFinal); // O último ponto é a nota REAL e exata
        return pontos;
    }

    // --- GRÁFICO MULTI-LINHAS (ESTILO BOLSA DE VALORES) ---
    function gerarGraficoProfessor(alunos) {
        const ctx = document.getElementById('graficoRankingProfessor');
        if (!ctx) return;

        if (window.graficoProf) window.graficoProf.destroy();

        const isDark = document.body.classList.contains('dark-mode');
        const corTexto = isDark ? '#cbd5e1' : '#64748b';
        const corGrid = isDark ? '#334155' : '#e2e8f0';

        // 1. Prepara os Datasets (Uma linha para cada aluno)
        // Pegamos apenas os Top 5 ou 7 para não virar bagunça na tela
        const topAlunos = alunos.slice(0, 7); 

        const datasets = topAlunos.map(aluno => {
            const cor = gerarCorAleatoria();
            return {
                label: aluno.nome, // Nome aparece na legenda/tooltip
                data: gerarHistorico(aluno.pontuacao_total), // Histórico simulado
                borderColor: cor,
                backgroundColor: cor,
                borderWidth: 3,
                pointRadius: 0, // Sem bolinhas no meio da linha (mais limpo)
                pointHoverRadius: 6,
                tension: 0.4, // Curva suave
                fill: false // Não preenche embaixo pra não misturar as cores
            };
        });

        window.graficoProf = new Chart(ctx, {
            type: 'line',
            data: {
                // Eixo X agora é TEMPO
                labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Atual'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true, // Mostra os nomes em cima (pra saber quem é quem)
                        labels: { color: corTexto, boxWidth: 10 }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        titleColor: isDark ? '#fff' : '#1e293b',
                        bodyColor: isDark ? '#cbd5e1' : '#64748b',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: { color: corTexto },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: corTexto },
                        grid: { color: corGrid, borderDash: [5, 5] }
                    }
                }
            }
        });
    }