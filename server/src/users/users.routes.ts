import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../database/prisma.js";
import { requireAuth, getAuthUserId } from "../auth/require-auth.js";
import { AVATARS_DIR } from "../uploads-dir.js";

const AVATAR_EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

const PUBLIC_USER_FIELDS = {
  id: true,
  username: true,
  avatarUrl: true,
  rankingPoints: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const FRIEND_FIELDS = {
  ...PUBLIC_USER_FIELDS,
  lastSeenAt: true,
} satisfies Prisma.UserSelect;

// "Online" = heartbeat recebido nos últimos 30s (ver POST /users/:id/heartbeat).
const ONLINE_THRESHOLD_MS = 30_000;

function withOnlineStatus<T extends { lastSeenAt: Date | null }>(user: T) {
  const { lastSeenAt, ...rest } = user;
  return { ...rest, online: !!lastSeenAt && Date.now() - lastSeenAt.getTime() < ONLINE_THRESHOLD_MS };
}

// Sem auth real ainda: essas rotas confiam no :id da URL (mesma limitação
// já documentada em server.md pro matchmaking). Uma vez que o login exista,
// precisam validar que o usuário da sessão é o dono do :id.
export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/users/health", async () => ({ status: "ok" }));

  app.get("/users/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    // Aceita id real ou username: sem auth ainda, o front só tem o username salvo localmente.
    const user = await prisma.user.findFirst({ where: { OR: [{ id }, { username: id }] }, select: PUBLIC_USER_FIELDS });
    if (!user) {
      reply.code(404);
      return { error: "User not found" };
    }
    const [matchesPlayed, wins] = await Promise.all([
      prisma.match.count({ where: { OR: [{ player1Id: user.id }, { player2Id: user.id }] } }),
      prisma.match.count({ where: { winnerId: user.id } }),
    ]);
    return { ...user, matchesPlayed, wins };
  });

  app.patch("/users/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { username, avatarUrl } = request.body as { username?: string; avatarUrl?: string };

    if (getAuthUserId(request) !== id) {
      reply.code(403);
      return { error: "Não é possível editar o perfil de outro usuário" };
    }

    try {
      return await prisma.user.update({
        where: { id },
        data: {
          ...(username !== undefined ? { username } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        },
        select: PUBLIC_USER_FIELDS,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          reply.code(404);
          return { error: "User not found" };
        }
        if (err.code === "P2002") {
          reply.code(409);
          return { error: "Username already taken" };
        }
      }
      throw err;
    }
  });

  app.post("/users/:id/avatar", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { avatarBase64 } = request.body as { avatarBase64?: string };

    if (getAuthUserId(request) !== id) {
      reply.code(403);
      return { error: "Não é possível editar o avatar de outro usuário" };
    }
    if (!avatarBase64) {
      reply.code(400);
      return { error: "avatarBase64 é obrigatório" };
    }

    const match = avatarBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    const ext = match ? AVATAR_EXT_BY_MIME[match[1] as string] : undefined;
    if (!match || !ext) {
      reply.code(400);
      return { error: "Formato inválido (use uma data URI de imagem png, jpg, webp ou gif)" };
    }

    const buffer = Buffer.from(match[2] as string, "base64");
    if (buffer.length > MAX_AVATAR_BYTES) {
      reply.code(400);
      return { error: "Imagem muito grande (máx. 2MB)" };
    }

    // Remove avatar anterior (pode ter extensão diferente da nova).
    const existingFiles = await fs.readdir(AVATARS_DIR).catch(() => [] as string[]);
    await Promise.all(
      existingFiles
        .filter((f) => f.startsWith(`${id}.`))
        .map((f) => fs.unlink(path.join(AVATARS_DIR, f)).catch(() => {})),
    );

    const filename = `${id}.${ext}`;
    await fs.writeFile(path.join(AVATARS_DIR, filename), buffer);

    return prisma.user.update({
      where: { id },
      data: { avatarUrl: `/avatars/${filename}` },
      select: PUBLIC_USER_FIELDS,
    });
  });

  app.get("/users/:id/matches", async (request) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findFirst({ where: { OR: [{ id }, { username: id }] } });
    if (!user) return [];

    const matches = await prisma.match.findMany({
      where: { endedAt: { not: null }, OR: [{ player1Id: user.id }, { player2Id: user.id }] },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: {
        player1: { select: { username: true } },
        player2: { select: { username: true } },
      },
    });

    return matches.map((match) => {
      const isPlayer1 = match.player1Id === user.id;
      return {
        id: match.id,
        opponent: isPlayer1 ? match.player2.username : match.player1.username,
        yourScore: isPlayer1 ? match.player1Score : match.player2Score,
        opponentScore: isPlayer1 ? match.player2Score : match.player1Score,
        result: match.winnerId === user.id ? "VITÓRIA" : "DERROTA",
        date: match.startedAt.toISOString(),
        arena: match.arenaId,
      };
    });
  });

  app.post("/users/:id/heartbeat", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    if (getAuthUserId(request) !== id) {
      reply.code(403);
      return { error: "Não é possível atualizar a presença de outro usuário" };
    }

    await prisma.user.update({ where: { id }, data: { lastSeenAt: new Date() } });
    return { status: "ok" };
  });

  app.get("/users/:id/friends", async (request) => {
    const { id } = request.params as { id: string };

    const friendships = await prisma.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: id }, { addresseeId: id }] },
      include: {
        requester: { select: FRIEND_FIELDS },
        addressee: { select: FRIEND_FIELDS },
      },
    });

    return friendships.map((f) => withOnlineStatus(f.requesterId === id ? f.addressee : f.requester));
  });

  app.get("/users/:id/friends/pending", async (request) => {
    const { id } = request.params as { id: string };

    const friendships = await prisma.friendship.findMany({
      where: { status: "PENDING", addresseeId: id },
      include: { requester: { select: PUBLIC_USER_FIELDS } },
    });

    return friendships.map((f) => ({ friendshipId: f.id, requester: f.requester }));
  });

  app.post("/users/:id/friends", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { targetUserId } = request.body as { targetUserId?: string };

    if (!targetUserId) {
      reply.code(400);
      return { error: "Invalid targetUserId" };
    }

    // Aceita id real ou username, igual GET /users/:id.
    const target = await prisma.user.findFirst({ where: { OR: [{ id: targetUserId }, { username: targetUserId }] } });
    if (!target) {
      reply.code(404);
      return { error: "targetUserId not found" };
    }
    if (target.id === id) {
      reply.code(400);
      return { error: "Invalid targetUserId" };
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: id, addresseeId: target.id },
          { requesterId: target.id, addresseeId: id },
        ],
      },
    });

    if (existing) {
      reply.code(409);
      return { error: `Friendship already exists with status ${existing.status}` };
    }

    return prisma.friendship.create({
      data: { requesterId: id, addresseeId: target.id, status: "PENDING" },
    });
  });

  app.patch("/users/:id/friends/:friendshipId", { preHandler: requireAuth }, async (request, reply) => {
    const { id, friendshipId } = request.params as { id: string; friendshipId: string };
    const { status } = request.body as { status?: "ACCEPTED" | "BLOCKED" };

    if (getAuthUserId(request) !== id) {
      reply.code(403);
      return { error: "Não é possível responder pedido de amizade de outro usuário" };
    }
    if (status !== "ACCEPTED" && status !== "BLOCKED") {
      reply.code(400);
      return { error: "status must be ACCEPTED or BLOCKED" };
    }

    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || friendship.addresseeId !== id) {
      reply.code(404);
      return { error: "Friend request not found" };
    }

    return prisma.friendship.update({ where: { id: friendshipId }, data: { status } });
  });

  app.delete("/users/:id/friends/:friendshipId", { preHandler: requireAuth }, async (request, reply) => {
    const { id, friendshipId } = request.params as { id: string; friendshipId: string };

    if (getAuthUserId(request) !== id) {
      reply.code(403);
      return { error: "Não é possível remover amizade de outro usuário" };
    }

    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || (friendship.requesterId !== id && friendship.addresseeId !== id)) {
      reply.code(404);
      return { error: "Friendship not found" };
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });
    reply.code(204);
  });
}
