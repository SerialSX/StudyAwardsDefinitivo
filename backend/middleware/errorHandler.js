const errorHandler = (err, req, res, next) => {
  console.error("ERRO CAPTURADO:", err.message);
  
  const statusCode = err.statusCode || 500; 

  res.status(statusCode).json({
    erro: err.message || 'Erro interno do servidor.'
  });
};

module.exports = errorHandler;