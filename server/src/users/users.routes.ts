import type { FastifyInstance } from "fastify";

/**
 * Perfil de usuário e sistema de amigos.
 * TODO: GET /users/:id, PATCH /users/me, POST /users/:id/friend-requests, etc.
 */
export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/users/health", async () => ({ status: "ok" }));
}
