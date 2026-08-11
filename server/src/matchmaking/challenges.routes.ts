import type { FastifyInstance } from "fastify";
import { prisma } from "../database/prisma.js";
import { requireAuth, getAuthUserId } from "../auth/require-auth.js";
import { challengeStore } from "./challenges.js";
import { matchManager } from "../matches/match-manager.js";
import { MatchmakingQueue } from "./queue.js";
import { pickRandomArenaId } from "./arenas.js";
import { startPowerupLoop } from "../game/powerup-authority.js";

/** Desafio direto entre amigos: cria a partida na hora do "accept", sem passar pela fila FIFO. */
export async function registerChallengeRoutes(app: FastifyInstance) {
  app.post("/users/:id/challenges", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { targetUserId } = request.body as { targetUserId?: string };

    if (getAuthUserId(request) !== id) {
      reply.code(403);
      return { error: "Não é possível desafiar em nome de outro usuário" };
    }
    if (!targetUserId) {
      reply.code(400);
      return { error: "targetUserId é obrigatório" };
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: id, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: id },
        ],
      },
    });
    if (!friendship) {
      reply.code(403);
      return { error: "Só é possível desafiar amigos" };
    }

    const challenge = challengeStore.create(id, targetUserId);
    reply.code(201);
    return { challengeId: challenge.id };
  });

  app.get("/users/:id/challenges", async (request) => {
    const { id } = request.params as { id: string };
    const challenges = challengeStore.listFor(id);
    if (challenges.length === 0) return [];

    const allIds = [...new Set(challenges.flatMap((c) => [c.fromUserId, c.toUserId]))];
    const users = await prisma.user.findMany({ where: { id: { in: allIds } }, select: { id: true, username: true } });
    const usernameById = new Map(users.map((u) => [u.id, u.username]));

    return challenges.map((c) => ({
      id: c.id,
      direction: c.fromUserId === id ? "sent" : "received",
      otherUsername: usernameById.get(c.fromUserId === id ? c.toUserId : c.fromUserId) ?? "?",
      status: c.status,
      match: c.match
        ? {
            matchId: c.match.matchId,
            arenaId: c.match.arenaId,
            seed: c.match.seed,
            slot: c.match.slots[id],
            // slots foram atribuídos no accept: fromUserId=1, toUserId=2 (ver abaixo)
            player1Username: usernameById.get(c.fromUserId) ?? "Player 1",
            player2Username: usernameById.get(c.toUserId) ?? "Player 2",
          }
        : null,
    }));
  });

  app.post("/users/:id/challenges/:challengeId/accept", { preHandler: requireAuth }, async (request, reply) => {
    const { id, challengeId } = request.params as { id: string; challengeId: string };

    if (getAuthUserId(request) !== id) {
      reply.code(403);
      return { error: "Não é possível aceitar em nome de outro usuário" };
    }

    const challenge = challengeStore.get(challengeId);
    if (!challenge || challenge.toUserId !== id || challenge.status !== "pending") {
      reply.code(404);
      return { error: "Desafio não encontrado" };
    }

    const arenaId = pickRandomArenaId();
    const seed = Math.floor(Math.random() * 2147483647);
    const match = matchManager.create(MatchmakingQueue.generateMatchId(), arenaId, seed);
    match.setExpectedUserId(1, challenge.fromUserId);
    match.setExpectedUserId(2, challenge.toUserId);
    startPowerupLoop(match);

    challenge.status = "accepted";
    challenge.match = {
      matchId: match.matchId,
      arenaId: match.arenaId,
      seed: match.seed,
      slots: { [challenge.fromUserId]: 1, [challenge.toUserId]: 2 },
    };

    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: challenge.fromUserId }, select: { username: true } }),
      prisma.user.findUnique({ where: { id: challenge.toUserId }, select: { username: true } }),
    ]);

    return {
      matchId: match.matchId,
      arenaId: match.arenaId,
      seed: match.seed,
      slot: 2,
      player1Username: fromUser?.username ?? "Player 1",
      player2Username: toUser?.username ?? "Player 2",
    };
  });

  app.delete("/users/:id/challenges/:challengeId", { preHandler: requireAuth }, async (request, reply) => {
    const { id, challengeId } = request.params as { id: string; challengeId: string };

    if (getAuthUserId(request) !== id) {
      reply.code(403);
      return { error: "Não é possível remover desafio de outro usuário" };
    }

    const challenge = challengeStore.get(challengeId);
    if (!challenge || (challenge.fromUserId !== id && challenge.toUserId !== id)) {
      reply.code(404);
      return { error: "Desafio não encontrado" };
    }

    challengeStore.remove(challengeId);
    reply.code(204);
  });
}
