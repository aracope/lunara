/**
 * Middleware: 404 notFound
 *
 * Catch-all for routes that don't match any defined endpoints.
 * - Should be placed after all other route handlers.
 * - Responds with a 404 status and JSON error message.
 *
 * Usage:
 *   app.use(notFound);
 */
export function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

/**
 * Middleware: errorHandler
 *
 * Generic error-handling middleware.
 * - Logs the error to the server console
 * - Returns a JSON response with the error message and HTTP status
 * - Defaults to 500 Internal Server Error if no status is provided
 *
 * Notes:
 * - In production, be cautious about exposing sensitive error messages.
 * - Can be enhanced to return structured errors or track with monitoring tools.
 *
 * Usage:
 *   app.use(errorHandler); // Always last in the middleware stack
 */
export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
}
