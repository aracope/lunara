// 404 handler
export function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

// Generic error handler
export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
}
