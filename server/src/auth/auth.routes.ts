import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { hashPassword, verifyPassword } from "./password.js";
import { signSession } from "./jwt.js";
import { generateTwoFactorCode, twoFactorCodeExpiry, sendTwoFactorEmail } from "./two-factor.js";
import { buildAuthorizeUrl, exchangeCodeForProfile } from "./oauth-fortytwo.js";
import { env } from "../env.js";

const PUBLIC_USER_FIELDS = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
  rankingPoints: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/**
 * Auth: OAuth 42, login/senha, sessão.
 * Não deve conter lógica de gameplay (ver backend_architecture.md).
 */
export async function registerAuthRoutes(app: FastifyInstance) {
  app.get("/auth/health", async () => ({ status: "ok" }));

  app.post("/auth/signup", async (request, reply) => {
    const { username, email, password } = request.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      reply.code(400);
      return { error: "username, email e password são obrigatórios" };
    }
    if (password.length < 8) {
      reply.code(400);
      return { error: "password precisa ter ao menos 8 caracteres" };
    }

    const passwordHash = await hashPassword(password);

    try {
      const user = await prisma.user.create({
        data: { username, email, passwordHash },
        select: PUBLIC_USER_FIELDS,
      });
      const token = signSession(user.id);
      reply.code(201);
      return { token, user };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        reply.code(409);
        return { error: "username ou email já cadastrado" };
      }
      throw err;
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const { email, password, use2fa } = request.body as { email?: string; password?: string; use2fa?: boolean };

    if (!email || !password) {
      reply.code(400);
      return { error: "email e password são obrigatórios" };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      reply.code(401);
      return { error: "credenciais inválidas" };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      reply.code(401);
      return { error: "credenciais inválidas" };
    }

    if (use2fa) {
      const code = generateTwoFactorCode();
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorCode: code, twoFactorCodeExpiresAt: twoFactorCodeExpiry() },
      });
      await sendTwoFactorEmail(user.email, code);
      return { requires2fa: true, userId: user.id };
    }

    return { token: signSession(user.id), user: toPublicUser(user) };
  });

  app.post("/auth/login/verify-2fa", async (request, reply) => {
    const { userId, code } = request.body as { userId?: string; code?: string };

    if (!userId || !code) {
      reply.code(400);
      return { error: "userId e code são obrigatórios" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorCode || !user.twoFactorCodeExpiresAt) {
      reply.code(401);
      return { error: "nenhum código pendente para esse usuário" };
    }

    if (user.twoFactorCodeExpiresAt < new Date()) {
      reply.code(401);
      return { error: "código expirado" };
    }
    if (user.twoFactorCode !== code) {
      reply.code(401);
      return { error: "código inválido" };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { twoFactorCode: null, twoFactorCodeExpiresAt: null },
    });

    return { token: signSession(updated.id), user: toPublicUser(updated) };
  });

  app.get("/auth/42", async (_request, reply) => {
    reply.redirect(buildAuthorizeUrl());
  });

  app.get("/auth/42/callback", async (request, reply) => {
    const { code } = request.query as { code?: string };
    if (!code) {
      reply.code(400);
      return { error: "code ausente" };
    }

    try {
      const profile = await exchangeCodeForProfile(code);
      const existingUser = await prisma.user.findUnique({ where: { fortyTwoId: profile.id } });

      const user = await prisma.user.upsert({
        where: { fortyTwoId: profile.id },
        update: { username: profile.login, email: profile.email },
        create: { fortyTwoId: profile.id, username: profile.login, email: profile.email },
      });

      const token = signSession(user.id);
      const redirectUrl = new URL("/login", env.frontendUrl);
      redirectUrl.searchParams.set("oauth_token", token);
      redirectUrl.searchParams.set("oauth_user_id", user.id);
      redirectUrl.searchParams.set("oauth_username", user.username);
      redirectUrl.searchParams.set("oauth_email", user.email);
      redirectUrl.searchParams.set("oauth_new_user", String(!existingUser));
      reply.redirect(redirectUrl.toString());
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        reply.code(409);
        return { error: "username ou email já em uso por outra conta" };
      }
      app.log.error({ err }, "Falha no callback OAuth 42");
      reply.code(502);
      return { error: "Falha ao autenticar com a 42" };
    }
  });
}

function toPublicUser(user: {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  rankingPoints: number;
  createdAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    rankingPoints: user.rankingPoints,
    createdAt: user.createdAt,
  };
}
