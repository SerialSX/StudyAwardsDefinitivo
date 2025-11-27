// --- CONFIGURAÇÃO DA API (GLOBAL) ---
// 1. Rodando no seu PC (Teste):
// const API_URL = "http://localhost:3000"; 

// 2. Rodando na Vercel (Produção):
const API_URL = "https://studyawardsdefinitivo-production.up.railway.app"; 
// ------------------------------------

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
    // CARREGAR DADOS GERAIS
    // ==========================================
    async function carregarDadosProfessor() {
        const token = localStorage.getItem('token');
        try {
            // USA API_URL
            const resResumo = await fetch(`${API_URL}/api/professor/resumo`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (resResumo.ok) {
                const dados = await resResumo.json();
                const elTotal = document.getElementById('total-alunos');
                const elPresentes = document.getElementById('presentes-hoje');
                const elAtivas = document.getElementById('atividades-ativas');

                if(elTotal) elTotal.textContent = dados.totalAlunos || 0;
                if(elPresentes) elPresentes.textContent = dados.presentesHoje || 0;
                if(elAtivas) elAtivas.textContent = dados.atividadesAtivas || 0;
            }

            const resRanking = await fetch(`${API_URL}/ranking`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataRanking = await resRanking.json();
            
            preencherTabelaAlunos(dataRanking.ranking);
            gerarGraficoProfessor(dataRanking.ranking);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    }

    // ==========================================
    // PREENCHER TABELA DE ALUNOS
    // ==========================================
    function preencherTabelaAlunos(alunos) {
        const tbody = document.getElementById('tabela-alunos-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        alunos.forEach(aluno => {
            const tr = document.createElement('tr');
            
            const diasLetivos = 200;
            const faltas = aluno.total_faltas || 0;
            let freq = Math.round(((diasLetivos - faltas) / diasLetivos) * 100);
            if (freq < 0) freq = 0;

            let badgeClass = 'badge-green';
            if (freq < 75) badgeClass = 'badge-red'; 
            else if (freq < 85) badgeClass = 'badge-yellow';

            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${aluno.nome}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">ID: ${aluno.id}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: #eab308;">★</span> 
                        <strong style="color: var(--text-primary);">${aluno.pontuacao_total}</strong>
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
                    <button class="btn-icon" onclick="abrirAcoesAluno(${aluno.id}, '${aluno.nome}')">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Event Listeners (Presença)
        tbody.querySelectorAll('.presence-buttons button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const clickedButton = event.target;
                const parentDiv = clickedButton.parentElement;
                const alunoId = parentDiv.dataset.alunoId;
                const nomeAluno = parentDiv.dataset.alunoNome;
                const token = localStorage.getItem('token');

                const isPresenceBtn = clickedButton.classList.contains('btn-presence');
                const buttons = parentDiv.querySelectorAll('button');
                
                buttons.forEach(btn => btn.style.opacity = '0.5'); 
                clickedButton.style.opacity = '1';

                if (isPresenceBtn) {
                    const Toast = Swal.mixin({
                        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
                    });
                    Toast.fire({ icon: 'success', title: `Presença confirmada` });
                } else {
                    const { value: motivo } = await Swal.fire({
                        title: `Registrar Falta`,
                        text: `Motivo da falta para ${nomeAluno}:`,
                        input: 'text',
                        inputPlaceholder: 'Ex: Atraso, Sem justificativa...',
                        inputValue: 'Falta injustificada',
                        showCancelButton: true,
                        confirmButtonText: 'Registrar',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: '#d33',
                        inputValidator: (value) => {
                            if (!value) return 'Escreva o motivo!'
                        }
                    });

                    if (motivo) {
                        try {
                            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
                            // USA API_URL
                            const response = await fetch(`${API_URL}/registrar-falta`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    alunoId: parseInt(alunoId),
                                    dataFalta: new Date().toISOString().split('T')[0],
                                    professorId: usuarioLogado.id,
                                    pontosDeduzidos: 10,
                                    motivo: motivo
                                })
                            });

                            if (response.ok) {
                                await Swal.fire('Falta Registrada', 'Frequência atualizada.', 'success');
                                carregarDadosProfessor(); 
                            } else {
                                Swal.fire('Erro', 'Não foi possível registrar.', 'error');
                            }
                        } catch (error) {
                            console.error(error);
                            Swal.fire('Erro', 'Erro de conexão.', 'error');
                        }
                    } else {
                        buttons.forEach(btn => btn.style.opacity = '1');
                    }
                }
            });
        });
    }

    // ==========================================
    // CRIAR ATIVIDADE
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
                // USA API_URL
                const resCreate = await fetch(`${API_URL}/api/desafios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(dadosDesafio)
                });
                const dataCreate = await resCreate.json();

                if (resCreate.ok) {
                    const resAssign = await fetch(`${API_URL}/api/desafios/atribuir-todos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ desafio_id: dataCreate.id })
                    });

                    if (resAssign.ok) {
                        Swal.fire('Sucesso', `Atividade "${titulo}" criada e atribuída!`, 'success');
                        formAba.reset();
                    }
                } else {
                    Swal.fire('Erro', dataCreate.erro, 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Erro', 'Erro de conexão.', 'error');
            } finally {
                btn.textContent = "Criar Atividade";
                btn.disabled = false;
            }
        });
    }

    // ==========================================
    // FILTRO DE BUSCA
    // ==========================================
    const inputFiltro = document.getElementById('filtro-aluno');
    if (inputFiltro) {
        inputFiltro.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const linhas = document.querySelectorAll('#tabela-alunos-body tr');

            linhas.forEach(linha => {
                const nome = linha.querySelector('td:first-child div').textContent.toLowerCase();
                if (nome.includes(termo)) {
                    linha.style.display = '';
                } else {
                    linha.style.display = 'none';
                }
            });
        });
    }

    // ==========================================
    // PAINEL DE CORREÇÃO
    // ==========================================
    async function carregarCorrecoes() {
        const token = localStorage.getItem('token');
        const container = document.getElementById('lista-correcoes');
        if(!container) return; 

        try {
            // USA API_URL
            const res = await fetch(`${API_URL}/api/desafios/pendentes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.entregas && data.entregas.length > 0) {
                container.innerHTML = ''; 
                
                data.entregas.forEach(entrega => {
                    const card = document.createElement('div');
                    card.style.cssText = "border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px; margin-bottom: 10px;";
                    
                    // LINK DA IMAGEM COM API_URL
                    const imgUrl = `${API_URL}/uploads/${entrega.comprovante_path.split(/[/\\]/).pop()}`;

                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>${entrega.nome_aluno}</strong>
                            <span class="badge badge-yellow">${entrega.pontos} pts</span>
                        </div>
                        <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">Entregou: ${entrega.titulo_desafio}</p>
                        
                        <div style="margin-bottom: 1rem;">
                            <a href="${imgUrl}" target="_blank" style="color: var(--primary-color); font-size: 0.85rem; text-decoration: underline;">
                                📎 Ver Comprovante (Foto)
                            </a>
                        </div>

                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="avaliar(${entrega.aluno_desafio_id}, true)" class="btn btn-primary" style="height: 30px; font-size: 0.8rem; background: #16a34a;">Aprovar ✅</button>
                            <button onclick="avaliar(${entrega.aluno_desafio_id}, false)" class="btn btn-secondary" style="height: 30px; font-size: 0.8rem; background: #ef4444; color: white; border: none;">Rejeitar ❌</button>
                        </div>
                    `;
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<p style="color: var(--text-secondary);">Tudo em dia! Nenhuma entrega pendente.</p>';
            }
        } catch (error) {
            console.error("Erro correções:", error);
        }
    }

    carregarDadosProfessor();
    carregarCorrecoes();

}); 

// ==========================================
// FUNÇÕES GLOBAIS
// ==========================================

window.avaliar = async (id, aprovou) => {
    const token = localStorage.getItem('token');
    
    const result = await Swal.fire({
        title: aprovou ? 'Aprovar?' : 'Rejeitar?',
        text: aprovou ? "Dar os pontos?" : "Devolver para refazer?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: aprovou ? '#16a34a' : '#ef4444',
        confirmButtonText: 'Sim'
    });

    if (!result.isConfirmed) return;

    try {
        // USA API_URL
        const res = await fetch(`${API_URL}/api/desafios/avaliar/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ aprovado: aprovou })
        });

        if (res.ok) {
            await Swal.fire('Feito!', 'Avaliação registrada.', 'success');
            window.location.reload(); 
        } else {
            Swal.fire('Erro', 'Falha ao avaliar.', 'error');
        }
    } catch (err) {
        Swal.fire('Erro', 'Erro de conexão.', 'error');
    }
};

window.abrirAcoesAluno = async (id, nome) => {
    // ... (O código do menu de ações continua igual, ele não usa fetch) ...
    // Vou resumir aqui pra caber na resposta, mas você mantém o que já tinha:
    const { value: acao } = await Swal.fire({
        title: `Gerenciar: ${nome}`,
        html: `<div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="btn-historico" class="swal2-confirm swal2-styled" style="background-color: #2563eb; width: 100%; margin: 0;">📜 Ver Histórico</button>
                <button id="btn-frequencia" class="swal2-confirm swal2-styled" style="background-color: #9333ea; width: 100%; margin: 0;">📅 Relatório Frequência</button>
                <button id="btn-perfil" class="swal2-confirm swal2-styled" style="background-color: #4b5563; width: 100%; margin: 0;">👤 Ver Perfil</button>
            </div>`,
        showConfirmButton: false, showCloseButton: true,
        didOpen: () => {
            document.getElementById('btn-historico').onclick = () => Swal.clickConfirm('historico');
            document.getElementById('btn-frequencia').onclick = () => Swal.clickConfirm('frequencia');
            document.getElementById('btn-perfil').onclick = () => Swal.clickConfirm('perfil');
        }
    });

    if (acao === 'historico') {
        Swal.fire({ title: `Histórico de ${nome}`, html: `<p>Dados de histórico...</p>`, width: 600 });
    } else if (acao === 'frequencia') {
        Swal.fire('Frequência', `Relatório de presença de ${nome}`, 'info');
    } else if (acao === 'perfil') {
        Swal.fire('Perfil', `Dados de ${nome}`, 'info');
    }
};

// ... (Aqui entra a função gerarGraficoProfessor que te mandei antes, ela não usa fetch) ...
function gerarGraficoProfessor(alunos) {
    // Cole aqui a função do gráfico
}