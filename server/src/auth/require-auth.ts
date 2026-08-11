import type { FastifyReply, FastifyRequest } from "fastify";
import { verifySession } from "./jwt.js";

// Decorado no request pelo preHandler abaixo; lido pela rota via getAuthUserId.
type AuthenticatedRequest = FastifyRequest & { userId?: string };

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
  const session = token ? verifySession(token) : null;

  if (!session) {
    reply.code(401);
    reply.send({ error: "token ausente ou inválido" });
    return;
  }

  (request as AuthenticatedRequest).userId = session.userId;
}

export function getAuthUserId(request: FastifyRequest): string {
  const userId = (request as AuthenticatedRequest).userId;
  if (!userId) {
    throw new Error("getAuthUserId chamado numa rota sem requireAuth no preHandler");
  }
  return userId;
}
