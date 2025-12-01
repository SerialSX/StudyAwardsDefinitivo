/* backend/controllers/dashboardController.js */
const db = require('../config/database.js');

// --- DASHBOARD PROFESSOR (COMPLETO) ---
exports.getDashboardProfessor = async (req, res, next) => {
    try {
        const hoje = new Date().toISOString().split('T')[0]; 
        
        const sqlResumo = `
            SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE tipo = 'ALUNO') as total_alunos,
                (SELECT COUNT(*) FROM penalidades WHERE data::text LIKE $1 AND motivo LIKE '%Falta%') as total_faltas,
                (SELECT COUNT(*) FROM desafios WHERE CAST(prazo_final AS DATE) >= CURRENT_DATE) as atividades_ativas
        `;
        
        const sqlRecentes = `
            SELECT u.nome as nome_aluno, d.titulo, ad.status, ad.data_conclusao
            FROM aluno_desafios ad
            JOIN usuarios u ON ad.aluno_id = u.id
            JOIN desafios d ON ad.desafio_id = d.id
            WHERE ad.status IN ('em_analise', 'concluido')
            ORDER BY ad.data_conclusao DESC
            LIMIT 5
        `;

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
        const faltasHoje = parseInt(resResumo.rows[0].total_faltas || 0);
        const presentesHoje = Math.max(0, totalAlunos - faltasHoje);

        // --- CÁLCULO DA PORCENTAGEM DE FREQUÊNCIA (HOJE) ---
        const freqPercent = totalAlunos > 0 ? Math.round((presentesHoje / totalAlunos) * 100) : 0;

        res.json({
            resumo: {
                totalAlunos: totalAlunos,
                presentesHoje: presentesHoje,
                atividadesAtivas: parseInt(resResumo.rows[0].atividades_ativas || 0),
                frequencia: freqPercent // Enviamos esse dado novo
            },
            atividadesRecentes: resRecentes.rows,
            dadosGrafico: resGrafico.rows
        });

    } catch (err) {
        next(err);
    }
};

// ... (Mantenha as outras funções getDashboardAluno, getDashboardResponsavel, getDetalhesAluno iguais) ...
// (Se quiser, copie o arquivo inteiro da resposta anterior e só mude a parte do cálculo acima)
exports.getDashboardAluno = (req, res, next) => {
    const alunoId = req.usuario.id;
    const sqlFrequencia = `SELECT data as data_aula, false as presente FROM penalidades WHERE aluno_id = $1 AND motivo LIKE '%Falta%' ORDER BY data DESC LIMIT 4`;
    const sqlTotalFaltas = `SELECT COUNT(*) as total FROM penalidades WHERE aluno_id = $1 AND motivo LIKE '%Falta%'`;
    const sqlAtividades = `SELECT COUNT(*) as total FROM aluno_desafios WHERE aluno_id = $1 AND status = 'concluido'`;
    db.query(sqlFrequencia, [alunoId], (err, resFreq) => {
        if (err) return next(err);
        db.query(sqlTotalFaltas, [alunoId], (err, resCount) => {
            if (err) return next(err);
            db.query(sqlAtividades, [alunoId], (err, resAtiv) => {
                if (err) return next(err);
                const totalFaltas = parseInt(resCount.rows[0].total || 0);
                const frequencia = Math.max(0, Math.round(((200 - totalFaltas) / 200) * 100));
                res.json({ historicoPresenca: resFreq.rows, frequenciaPercentual: frequencia, atividadesConcluidas: parseInt(resAtiv.rows[0].total || 0) });
            });
        });
    });
};
exports.getDetalhesAluno = (req, res, next) => {
    const { id } = req.params;
    db.query(`SELECT id, nome, email, pontuacao_total FROM usuarios WHERE id = $1`, [id], (err, resUser) => {
        if(err || resUser.rows.length === 0) return next(err);
        db.query(`SELECT COUNT(*) as total_faltas FROM penalidades WHERE aluno_id = $1 AND motivo LIKE '%Falta%'`, [id], (err, resFreq) => {
            if(err) return next(err);
            const faltas = parseInt(resFreq.rows[0].total_faltas) || 0;
            const porcentagem = Math.round(((200-faltas)/200)*100);
            res.json({ aluno: resUser.rows[0], frequencia: { porcentagem, faltas, presencas: 200-faltas, total: 200 } });
        });
    });
};
exports.getDashboardResponsavel = (req, res, next) => {
    const alunoId = req.query.alunoId;
    if (!alunoId) return res.status(400).json({ erro: "ID obrigatório" });
    db.query(`SELECT d.titulo as nome, ad.data_conclusao as data, d.pontos, ad.status FROM aluno_desafios ad JOIN desafios d ON ad.desafio_id = d.id WHERE ad.aluno_id = $1 ORDER BY ad.data_conclusao DESC NULLS LAST LIMIT 5`, [alunoId], (err, r) => res.json({ atividadesRecentes: r.rows }));
};