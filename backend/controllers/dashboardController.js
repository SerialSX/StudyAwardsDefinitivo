const db = require('../config/database.js');

// --- DASHBOARD PROFESSOR (Resumo) ---
exports.getResumoProfessor = (req, res, next) => {
    const hoje = new Date().toISOString().split('T')[0]; 
    const sqlTotalAlunos = "SELECT COUNT(*) as total FROM usuarios WHERE tipo = 'ALUNO'";
    const sqlFaltasHoje = "SELECT COUNT(*) as faltas FROM penalidades WHERE data::text LIKE $1 AND motivo LIKE '%Falta%'";
    const sqlAtividadesAtivas = "SELECT COUNT(*) as ativas FROM desafios WHERE CAST(prazo_final AS DATE) >= CURRENT_DATE";

    db.query(sqlTotalAlunos, [], (err, resTotal) => {
        if(err) return next(err);
        
        db.query(sqlFaltasHoje, [`${hoje}%`], (err, resFaltas) => {
            if(err) return next(err);

            db.query(sqlAtividadesAtivas, [], (err, resAtivas) => {
                if(err) return next(err);

                const total = parseInt(resTotal.rows[0].total);
                const faltas = parseInt(resFaltas.rows[0].faltas);
                const ativas = parseInt(resAtivas.rows[0].ativas);
                const presentes = total - faltas;

                res.json({
                    totalAlunos: total,
                    presentesHoje: Math.max(0, presentes),
                    atividadesAtivas: ativas
                });
            });
        });
    });
};

// --- DASHBOARD ALUNO (NOVO - Traz os dados reais) ---
exports.getDashboardAluno = (req, res, next) => {
    const alunoId = req.usuario.id;

    // 1. Busca as últimas 4 presenças/faltas reais
    const sqlFrequencia = `
        SELECT data_falta as data_aula, false as presente 
        FROM frequencia 
        WHERE aluno_id = $1 
        ORDER BY data_falta DESC 
        LIMIT 4
    `;
    
    // 2. Busca total de atividades concluídas
    const sqlAtividades = `
        SELECT COUNT(*) as total 
        FROM aluno_desafios 
        WHERE aluno_id = $1 AND status = 'concluido'
    `;

    db.query(sqlFrequencia, [alunoId], (err, resFreq) => {
        if (err) return next(err);
        
        db.query(sqlAtividades, [alunoId], (err, resAtiv) => {
            if (err) return next(err);

            res.json({
                historicoPresenca: resFreq.rows,
                atividadesConcluidas: parseInt(resAtiv.rows[0].total || 0)
            });
        });
    });
};

// --- DASHBOARD RESPONSÁVEL (NOVO) ---
exports.getDashboardResponsavel = (req, res, next) => {
    const alunoId = req.query.alunoId;
    if (!alunoId) return res.status(400).json({ erro: "ID do aluno não fornecido." });

    const sqlAtividades = `
        SELECT d.titulo as nome, ad.data_conclusao as data, d.pontos, ad.status
        FROM aluno_desafios ad
        JOIN desafios d ON ad.desafio_id = d.id
        WHERE ad.aluno_id = $1
        ORDER BY ad.data_conclusao DESC NULLS LAST
        LIMIT 5
    `;

    db.query(sqlAtividades, [alunoId], (err, result) => {
        if (err) return next(err);
        res.json({ atividadesRecentes: result.rows });
    });
};

// --- DETALHES DO ALUNO (Para o Professor) ---
exports.getDetalhesAluno = async (req, res, next) => {
    const { id } = req.params;
    const sqlUser = `SELECT id, nome, email, pontuacao_total, tipo FROM usuarios WHERE id = $1`;
    // Simulação de stats de frequência para o modal do professor
    const sqlFreq = `SELECT COUNT(*) as total_faltas FROM frequencia WHERE aluno_id = $1`;

    db.query(sqlUser, [id], (err, resUser) => {
        if(err) return next(err);
        if(resUser.rows.length === 0) return res.status(404).json({erro: "Aluno não encontrado"});

        db.query(sqlFreq, [id], (err, resFreq) => {
            if(err) return next(err);
            
            const faltas = parseInt(resFreq.rows[0].total_faltas) || 0;
            // Assumindo 200 dias letivos base para cálculo de %
            const totalDias = 200; 
            const porcentagem = Math.round(((totalDias - faltas) / totalDias) * 100);

            res.json({
                aluno: resUser.rows[0],
                frequencia: {
                    porcentagem: porcentagem,
                    faltas: faltas,
                    presencas: totalDias - faltas,
                    total: totalDias
                }
            });
        });
    });
};