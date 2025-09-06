import app from "./app.js";
import { PORT } from "./config.js";

/**
 * Server Entrypoint
 *
 * - Imports the configured Express app from app.js
 * - Starts the HTTP server on the configured PORT
 *
 * Notes:
 * - Keep this file minimal: all middleware, routes, and config belong in app.js
 * - This separation makes it easier to test `app` without starting a server
 *
 * Usage:
 *   node server.js
 */
app.listen(PORT, () => {
  console.log(`Lunara API listening on http://localhost:${PORT}`);
});
