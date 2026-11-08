// src/routes/api/health/+server.js
/**
 * Health check for Docker and uptime monitors; always "ok".
 *
 * @type {import('./$types').RequestHandler}
 */
export const GET = () => new Response('ok')
