// Middleware para capturar erros e tratá-los adequadamente
export const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);
  
  // Definindo código de status apropriado
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

// Middleware para lidar com rotas não encontradas
export const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada: ${req.originalUrl}`);
  res.status(404);
  next(error);
}; 