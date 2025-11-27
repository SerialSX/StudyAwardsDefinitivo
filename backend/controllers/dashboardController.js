const db = require('../config/database.js');

exports.getResumoProfessor = (req, res, next) => {
    const hoje = new Date().toISOString().split('T')[0]; 

    // Postgres usa $1 para parâmetros
    const sqlTotalAlunos = "SELECT COUNT(*) as total FROM usuarios WHERE tipo = 'ALUNO'";
    const sqlFaltasHoje = "SELECT COUNT(*) as faltas FROM penalidades WHERE data::text LIKE $1 AND motivo LIKE '%Falta%'"; // Cast ::text ajuda no Postgres
    const sqlAtividadesAtivas = "SELECT COUNT(*) as ativas FROM desafios WHERE CAST(prazo_final AS DATE) >= CURRENT_DATE";

    // Callback Hell adaptado para Postgres (db.query)
    db.query(sqlTotalAlunos, [], (err, resTotal) => {
        if(err) return next(err);
        
        db.query(sqlFaltasHoje, [`${hoje}%`], (err, resFaltas) => {
            if(err) return next(err);

            db.query(sqlAtividadesAtivas, [], (err, resAtivas) => {
                if(err) return next(err);

                // No Postgres, o count vem como string (tipo "5"), precisamos converter
                const total = parseInt(resTotal.rows[0].total);
                const faltas = parseInt(resFaltas.rows[0].faltas);
                const ativas = parseInt(resAtivas.rows[0].ativas);
                
                const presentes = total - faltas;

                res.json({
                    totalAlunos: total,
                    presentesHoje: presentes,
                    atividadesAtivas: ativas
                });
            });
        });
    });
};