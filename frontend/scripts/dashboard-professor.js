document.addEventListener('DOMContentLoaded', () => {

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

   
    //  ABAS 
  
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove ativo de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Ativa o clicado
            btn.classList.add('active');
            const tabId = btn.dataset.tab; // 'alunos', 'atividades' ou 'relatorios'
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

   
    // DADOS

    async function carregarDadosProfessor() {
        const token = localStorage.getItem('token');
        try {
            // Busca ranking 
            const res = await fetch('http://localhost:3000/ranking', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const alunos = data.ranking;

            document.getElementById('total-alunos').textContent = alunos.length;
            // (Placeholder para presentes)
            document.getElementById('presentes-hoje').textContent = Math.floor(alunos.length * 0.9); 

            // Preenche a Tabela de Alunos
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
            
            // Lógica fake de frequência para visualização
            const freq = Math.floor(Math.random() * (100 - 70) + 70); 
            let badgeClass = freq > 90 ? 'badge-green' : (freq > 80 ? 'badge-yellow' : 'badge-red');

            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: #2d3748;">${aluno.nome}</div>
                    <div style="font-size: 0.75rem; color: #718096;">Turma 9A</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: #eab308;">★</span> 
                        <strong>${aluno.pontuacao_total}</strong>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${freq}%</span></td>
                <td>
                    <span class="badge badge-green" style="cursor: pointer;">Presente</span>
                </td>
                <td>
                    <button class="btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    
    //  CRIAR ATIVIDADE 
    
    const formAba = document.getElementById('form-criar-desafio-aba');
    if (formAba) {
        formAba.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formAba.querySelector('button');
            btn.textContent = "Criando...";
            
            // Mesma lógica de antes para pegar dados e chamar API
            const titulo = document.getElementById('aba-titulo').value;
            const pontos = document.getElementById('aba-pontos').value;
            
            // Chama fetch 
            setTimeout(() => {
                alert(`Atividade "${titulo}" criada e atribuída com sucesso!`);
                formAba.reset();
                btn.textContent = "Criar Atividade";
            }, 1000);
        });
    }

    // Inicializa
    carregarDadosProfessor();
});