const { db } = require('../config/database.js');

exports.getResumoProfessor = (req, res, next) => {
    // Vamos rodar 3 queries em paralelo (Total Alunos, Presentes Hoje, Atividades Ativas)
    
    const hoje = new Date().toISOString().split('T')[0]; // Data YYYY-MM-DD

    const sqlTotalAlunos = "SELECT COUNT(*) as total FROM usuarios WHERE tipo = 'ALUNO'";
    
    // Conta presenças registradas hoje na tabela frequencia (se você tiver essa tabela populada)
    // Se não tiver tabela frequencia usada assim, podemos simular ou contar alunos sem falta hoje.
    // Vamos assumir que "Presentes" = Total - Faltas registradas hoje.
    const sqlFaltasHoje = "SELECT COUNT(*) as faltas FROM penalidades WHERE data LIKE ? AND motivo LIKE '%Falta%'";

    const sqlAtividadesAtivas = "SELECT COUNT(*) as ativas FROM desafios WHERE prazo_final >= date('now')";

    db.get(sqlTotalAlunos, [], (err, rowTotal) => {
        if(err) return next(err);
        
        db.get(sqlFaltasHoje, [`${hoje}%`], (err, rowFaltas) => {
            if(err) return next(err);

            db.get(sqlAtividadesAtivas, [], (err, rowAtivas) => {
                if(err) return next(err);

                const total = rowTotal.total;
                const faltas = rowFaltas.faltas;
                const presentes = total - faltas; // Lógica simples

                res.json({
                    totalAlunos: total,
                    presentesHoje: presentes,
                    atividadesAtivas: rowAtivas.ativas
                });
            });
        });
    });
};