/* backend/controllers/dashboardController.js */
const db = require('../config/database.js');

// --- DASHBOARD PROFESSOR (COMPLETO) ---
exports.getDashboardProfessor = async (req, res, next) => {
    try {
        const hoje = new Date().toISOString().split('T')[0]; 
        
        // 1. Resumo (Cards do Topo)
        const sqlResumo = `
            SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE tipo = 'ALUNO') as total_alunos,
                -- CORREÇÃO: Conta faltas na tabela certa (frequencia)
                (SELECT COUNT(*) FROM frequencia WHERE data_falta::text LIKE $1) as total_faltas_hoje,
                (SELECT COUNT(*) FROM desafios WHERE CAST(prazo_final AS DATE) >= CURRENT_DATE) as atividades_ativas
        `;
        
        // 2. Atividades Recentes
        const sqlRecentes = `
            SELECT u.nome as nome_aluno, d.titulo, ad.status, ad.data_conclusao
            FROM aluno_desafios ad
            JOIN usuarios u ON ad.aluno_id = u.id
            JOIN desafios d ON ad.desafio_id = d.id
            WHERE ad.status IN ('em_analise', 'concluido')
            ORDER BY ad.data_conclusao DESC
            LIMIT 5
        `;

        // 3. Gráfico
        const sqlGrafico = `
            SELECT u.nome, TO_CHAR(ad.data_conclusao, 'Mon') as mes, SUM(d.pontos) as pontos
            FROM aluno_desafios ad
            JOIN desafios d ON ad.desafio_id = d.id
            JOIN usuarios u ON ad.aluno_id = u.id
            WHERE ad.status = 'concluido' 
            AND ad.data_conclusao > current_date - interval '6 months'
            GROUP BY u.nome, mes, DATE_TRUNC('month', ad.data_conclusao)
            ORDER BY DATE_TRUNC('month', ad.data_conclusao) ASC
        `;

        const [resResumo, resRecentes, resGrafico] = await Promise.all([
            db.query(sqlResumo, [`${hoje}%`]),
            db.query(sqlRecentes),
            db.query(sqlGrafico)
        ]);

        const totalAlunos = parseInt(resResumo.rows[0].total_alunos || 0);
        const faltasHoje = parseInt(resResumo.rows[0].total_faltas_hoje || 0);
        const presentesHoje = Math.max(0, totalAlunos - faltasHoje);
        
        // Cálculo da Frequência DIÁRIA da Turma
        const freqPercent = totalAlunos > 0 ? Math.round((presentesHoje / totalAlunos) * 100) : 0;

        res.json({
            resumo: {
                totalAlunos: totalAlunos,
                presentesHoje: presentesHoje,
                atividadesAtivas: parseInt(resResumo.rows[0].atividades_ativas || 0),
                frequencia: freqPercent
            },
            atividadesRecentes: resRecentes.rows,
            dadosGrafico: resGrafico.rows
        });

    } catch (err) {
        next(err);
    }
};

// --- DASHBOARD ALUNO ---
exports.getDashboardAluno = (req, res, next) => {
    const alunoId = req.usuario.id;

    // 1. Histórico de Presença (Últimas 4)
    const sqlFrequencia = `
        SELECT data_falta as data_aula, false as presente 
        FROM frequencia 
        WHERE aluno_id = $1 
        ORDER BY data_falta DESC 
        LIMIT 4
    `;
    
    // 2. Total de Faltas (CORREÇÃO: Usa tabela frequencia)
    const sqlTotalFaltas = `SELECT COUNT(*) as total FROM frequencia WHERE aluno_id = $1`;

    // 3. Atividades
    const sqlAtividades = `
        SELECT COUNT(*) as total 
        FROM aluno_desafios 
        WHERE aluno_id = $1 AND status = 'concluido'
    `;

    db.query(sqlFrequencia, [alunoId], (err, resFreq) => {
        if (err) return next(err);
        
        db.query(sqlTotalFaltas, [alunoId], (err, resTotalFaltas) => {
            if (err) return next(err);

            db.query(sqlAtividades, [alunoId], (err, resAtiv) => {
                if (err) return next(err);

                // Cálculo da % de Frequência (Base 200 dias letivos)
                const totalFaltas = parseInt(resTotalFaltas.rows[0].total || 0);
                const diasLetivos = 200;
                const frequencia = Math.max(0, Math.round(((diasLetivos - totalFaltas) / diasLetivos) * 100));

                res.json({
                    historicoPresenca: resFreq.rows,
                    frequenciaPercentual: frequencia,
                    atividadesConcluidas: parseInt(resAtiv.rows[0].total || 0)
                });
            });
        });
    });
};

// --- DASHBOARD RESPONSÁVEL ---
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
    // Evolução (Gráfico Responsável)
    const sqlGrafico = `
        SELECT TO_CHAR(ad.data_conclusao, 'Mon') as mes, SUM(d.pontos) as pontos
        FROM aluno_desafios ad
        JOIN desafios d ON ad.desafio_id = d.id
        WHERE ad.aluno_id = $1 AND ad.status = 'concluido'
        GROUP BY TO_CHAR(ad.data_conclusao, 'Mon'), DATE_TRUNC('month', ad.data_conclusao)
        ORDER BY DATE_TRUNC('month', ad.data_conclusao) ASC
    `;

    db.query(sqlAtividades, [alunoId], (err, resAtiv) => {
        if (err) return next(err);
        db.query(sqlGrafico, [alunoId], (err, resGrafico) => {
            if (err) return next(err);
            res.json({
                atividadesRecentes: resAtiv.rows,
                evolucaoDesempenho: resGrafico.rows
            });
        });
    });
};

// --- DETALHES DO ALUNO (Modal) ---
exports.getDetalhesAluno = (req, res, next) => {
    const { id } = req.params;
    const sqlUser = `SELECT id, nome, email, pontuacao_total, tipo FROM usuarios WHERE id = $1`;
    
    // CORREÇÃO: Conta na tabela frequencia
    const sqlFreq = `SELECT COUNT(*) as total_faltas FROM frequencia WHERE aluno_id = $1`;

    db.query(sqlUser, [id], (err, resUser) => {
        if(err) return next(err);
        if(resUser.rows.length === 0) return res.status(404).json({erro: "Aluno não encontrado"});

        db.query(sqlFreq, [id], (err, resFreq) => {
            if(err) return next(err);
            
            const faltas = parseInt(resFreq.rows[0].total_faltas) || 0;
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