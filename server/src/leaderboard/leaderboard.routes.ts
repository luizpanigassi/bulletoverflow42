import type { FastifyInstance } from "fastify";
import { prisma } from "../database/prisma.js";

/**
 * Leaderboard: ranking e histórico. Executado apenas após o término da partida.
 * Vencedor: +3 pontos de ranking. Perdedor: -1 ponto (ver backend_contract.md).
 */
export async function registerLeaderboardRoutes(app: FastifyInstance) {
  app.get("/leaderboard-data", async () => {
    const topPlayers = await prisma.user.findMany({
      orderBy: { rankingPoints: "desc" },
      take: 50,
      select: { id: true, username: true, avatarUrl: true, rankingPoints: true },
    });
    return topPlayers;
  });
}
