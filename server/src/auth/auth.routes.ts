import type { FastifyInstance } from "fastify";

/**
 * Auth: OAuth 42, login/senha, sessão.
 * Não deve conter lógica de gameplay (ver backend_architecture.md).
 * TODO: signup, login (hash+salt via argon2/bcrypt), GET /auth/42, GET /auth/42/callback.
 */
export async function registerAuthRoutes(app: FastifyInstance) {
  app.get("/auth/health", async () => ({ status: "ok" }));
}
