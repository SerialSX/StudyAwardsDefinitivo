const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;
const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados 'banco.db' com sucesso.");
    
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, senha TEXT NOT NULL, tipo TEXT NOT NULL, pontuacao_total INTEGER DEFAULT 0)`);
      db.run(`CREATE TABLE IF NOT EXISTS penalidades (id INTEGER PRIMARY KEY AUTOINCREMENT, aluno_id INTEGER NOT NULL, motivo TEXT NOT NULL, pontos_deduzidos INTEGER DEFAULT 0, data TEXT NOT NULL, FOREIGN KEY (aluno_id) REFERENCES usuarios (id))`);
      db.run(`CREATE TABLE IF NOT EXISTS frequencia (id INTEGER PRIMARY KEY AUTOINCREMENT, aluno_id INTEGER NOT NULL, data_falta TEXT NOT NULL, registrado_por_professor_id INTEGER, FOREIGN KEY (aluno_id) REFERENCES usuarios (id))`);
      db.run(`CREATE TABLE IF NOT EXISTS desafios (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, descricao TEXT, pontos INTEGER NOT NULL, prazo_final TEXT, criado_por_professor_id INTEGER, FOREIGN KEY (criado_por_professor_id) REFERENCES usuarios (id))`);
      db.run(`CREATE TABLE IF NOT EXISTS aluno_desafios (id INTEGER PRIMARY KEY AUTOINCREMENT, aluno_id INTEGER NOT NULL, desafio_id INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pendente', data_conclusao TEXT, FOREIGN KEY (aluno_id) REFERENCES usuarios (id), FOREIGN KEY (desafio_id) REFERENCES desafios (id))`);
    });

    // --- ROTAS ---
    app.get('/', (req, res) => {
      res.send('Servidor funcionando e conectado ao banco de dados!');
    });

    // Rota pontuação real
    app.get('/usuarios/:id/pontuacao', (req, res) => {
      const usuarioId = req.params.id;
      db.get(`SELECT nome, pontuacao_total FROM usuarios WHERE id = ?`, [usuarioId], (err, row) => {
        if (err) { res.status(500).json({ erro: "Erro interno do servidor." }); }
        else if (!row) { res.status(404).json({ erro: "Usuário não encontrado." }); }
        else { res.json({ id: usuarioId, nome: row.nome, pontuacao_total: row.pontuacao_total }); }
      });
    });

    app.get('/ranking', (req, res) => {
      const sql = `SELECT id, nome, pontuacao_total FROM usuarios ORDER BY pontuacao_total DESC`;
      db.all(sql, [], (err, rows) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ ranking: rows });
      });
    });
    
    // Rota adicionar a pontuação do usuário
    app.post('/usuarios/:id/pontuacao', (req, res) => {
        const usuarioId = req.params.id;
        const { pontos } = req.body;
        if (typeof pontos !== 'number') {
            return res.status(400).json({ erro: "Campo 'pontos' deve ser um número." });
        }
        const query = `UPDATE usuarios SET pontuacao_total = pontuacao_total + ? WHERE id = ?`;
        db.run(query, [pontos, usuarioId], function (err) {
            if (err) { res.status(500).json({ erro: "Erro interno do servidor." }); }
            else if (this.changes === 0) { res.status(404).json({ erro: "Usuário não encontrado." }); }
            else { res.json({ mensagem: "Pontuação atualizada com sucesso!" }); }
        });
    });

    // Rota verificação de penalidades
    app.get('/alunos/:id/penalidades', (req, res) => {
      const alunoId = req.params.id;
      const sql = "SELECT motivo, pontos_deduzidos, data FROM penalidades WHERE aluno_id = ?";
      db.all(sql, [alunoId], (err, rows) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        res.json({ historico: rows });
      });
    });

    app.post('/registrar-falta', (req, res) => {
        const { alunoId, dataFalta, professorId, pontosDeduzidos, motivo } = req.body;
        const dataAtual = new Date().toISOString();
        const sqlFrequencia = `INSERT INTO frequencia (aluno_id, data_falta, registrado_por_professor_id) VALUES (?, ?, ?)`;
        db.run(sqlFrequencia, [alunoId, dataFalta, professorId], function (err) {
            if (err) { return res.status(500).json({ error: `Erro ao registrar falta: ${err.message}` }); }
            const sqlPenalidade = `INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES (?, ?, ?, ?)`;
            db.run(sqlPenalidade, [alunoId, motivo, pontosDeduzidos, dataAtual], function (err) {
                if (err) { return res.status(500).json({ error: `Erro ao criar penalidade: ${err.message}` }); }
                const sqlPontuacao = `UPDATE usuarios SET pontuacao_total = pontuacao_total - ? WHERE id = ?`;
                db.run(sqlPontuacao, [pontosDeduzidos, alunoId], function(err) {
                    if (err) { return res.status(500).json({ error: `Erro ao atualizar pontuação: ${err.message}`}); }
                    res.status(201).json({ message: "Falta e penalidade registradas com sucesso!" });
                });
            });
        });
    });

    // Rota aplicação de penalidades por tarefas atrasadas
    app.get('/verificar-atrasos', (req, res) => {
        const sqlBuscaAtrasos = `
            SELECT 
                ad.id as aluno_desafio_id,
                ad.aluno_id,
                d.titulo as desafio_titulo
            FROM aluno_desafios ad
            JOIN desafios d ON ad.desafio_id = d.id
            WHERE ad.status = 'pendente' AND d.prazo_final < DATE('now')
        `;
        db.all(sqlBuscaAtrasos, [], (err, rows) => {
            if (err) { return res.status(500).json({ error: `Erro ao buscar tarefas atrasadas: ${err.message}` }); }
            if (rows.length === 0) { return res.json({ message: "Nenhuma tarefa atrasada encontrada." }); }
            rows.forEach(tarefa => {
                const pontosDeduzidos = 20;
                const motivo = `Atraso na entrega do desafio: ${tarefa.desafio_titulo}`;
                const dataAtual = new Date().toISOString();
                db.serialize(() => {
                    db.run(`INSERT INTO penalidades (aluno_id, motivo, pontos_deduzidos, data) VALUES (?, ?, ?, ?)`, [tarefa.aluno_id, motivo, pontosDeduzidos, dataAtual]);
                    db.run(`UPDATE usuarios SET pontuacao_total = pontuacao_total - ? WHERE id = ?`, [pontosDeduzidos, tarefa.aluno_id]);
                    db.run(`UPDATE aluno_desafios SET status = 'atrasado' WHERE id = ?`, [tarefa.aluno_desafio_id]);
                });
            });
            res.json({ message: `Verificação concluída. ${rows.length} penalidade(s) aplicada(s).` });
        });
    });


    app.listen(PORT, () => {
      console.log(`Servidor iniciado e rodando na porta ${PORT}.`);
    });
  }
});

app.get('/api/desafios', (req, res) => {
  const alunoId = req.query.alunoId;

  if (!alunoId) {
    return res.status(400).json({ erro: "ID do aluno é obrigatório (ex: /api/desafios?alunoId=1)" });
  }

  const sql = `
    SELECT 
      d.id, 
      d.titulo, 
      d.descricao, 
      d.pontos, 
      d.prazo_final,
      ad.status,
      ad.data_conclusao,
      ad.id as aluno_desafio_id -- ID da LIGAÇÃO entre aluno e desafio
    FROM desafios d 
    JOIN aluno_desafios ad ON d.id = ad.desafio_id 
    WHERE ad.aluno_id = ?
  `;

  db.all(sql, [alunoId], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar desafios do aluno:", err.message);
      return res.status(500).json({ erro: "Erro ao buscar desafios." });
    }

    res.json({ desafios: rows });
  });
});

app.post('/api/cadastro', (req, res) => {
  const { nome, email, senha, tipo } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
  }

  const sql = `INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`;

  db.run(sql, [nome, email, senha, tipo], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ erro: "Erro ao cadastrar usuário. O email pode já estar em uso." });
    }

    res.status(201).json({
      id: this.lastID,
      nome: nome,
      email: email,
      tipo: tipo
    });
  });
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios." });
  }

  const sql = `SELECT * FROM usuarios WHERE email = ?`;

  db.get(sql, [email], (err, row) => {
    if (err) {
      return res.status(500).json({ erro: "Erro interno do servidor." });
    }

    if (!row) {
      return res.status(404).json({ erro: "Email não encontrado." });
    }

    if (row.senha !== senha) {
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    res.json({
      message: "Login bem-sucedido!",
      usuario: {
        id: row.id,
        nome: row.nome,
        email: row.email,
        tipo: row.tipo,
        pontuacao_total: row.pontuacao_total
      }
    });
  });
});