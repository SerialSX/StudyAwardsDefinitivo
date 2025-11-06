const errorHandler = (err, req, res, next) => {
  console.error("ERRO CAPTURADO:", err.message); // Loga o erro no console do backend

  // Pega o status code do erro, se ele não tiver, usa 500 (Erro Interno)
  const statusCode = err.statusCode || 500; 

  // Retorna uma resposta JSON padronizada para o frontend
  res.status(statusCode).json({
    erro: err.message || 'Erro interno do servidor.'
  });
};

module.exports = errorHandler;