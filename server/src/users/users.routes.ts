import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";

const PUBLIC_USER_FIELDS = {
  id: true,
  username: true,
  avatarUrl: true,
  rankingPoints: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

// Sem auth real ainda: essas rotas confiam no :id da URL (mesma limitação
// já documentada em server.md pro matchmaking). Uma vez que o login exista,
// precisam validar que o usuário da sessão é o dono do :id.
export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/users/health", async () => ({ status: "ok" }));

  app.get("/users/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_FIELDS });
    if (!user) {
      reply.code(404);
      return { error: "User not found" };
    }
    return user;
  });

  app.patch("/users/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { username, avatarUrl } = request.body as { username?: string; avatarUrl?: string };

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

  app.get("/users/:id/friends", async (request) => {
    const { id } = request.params as { id: string };

    const friendships = await prisma.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: id }, { addresseeId: id }] },
      include: {
        requester: { select: PUBLIC_USER_FIELDS },
        addressee: { select: PUBLIC_USER_FIELDS },
      },
    });

    return friendships.map((f) => (f.requesterId === id ? f.addressee : f.requester));
  });

  app.post("/users/:id/friends", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { targetUserId } = request.body as { targetUserId?: string };

    if (!targetUserId || targetUserId === id) {
      reply.code(400);
      return { error: "Invalid targetUserId" };
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: id, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: id },
        ],
      },
    });

    if (existing) {
      reply.code(409);
      return { error: `Friendship already exists with status ${existing.status}` };
    }

    try {
      return await prisma.friendship.create({
        data: { requesterId: id, addresseeId: targetUserId, status: "PENDING" },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        reply.code(404);
        return { error: "targetUserId not found" };
      }
      throw err;
    }
  });

  app.patch("/users/:id/friends/:friendshipId", async (request, reply) => {
    const { id, friendshipId } = request.params as { id: string; friendshipId: string };
    const { status } = request.body as { status?: "ACCEPTED" | "BLOCKED" };

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

  app.delete("/users/:id/friends/:friendshipId", async (request, reply) => {
    const { id, friendshipId } = request.params as { id: string; friendshipId: string };

    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || (friendship.requesterId !== id && friendship.addresseeId !== id)) {
      reply.code(404);
      return { error: "Friendship not found" };
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });
    reply.code(204);
  });
}
