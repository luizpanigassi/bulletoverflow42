import { ArenaId } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import type { Match } from "./match-manager.js";

const WINNER_POINTS = 3;
const LOSER_POINTS = -1;

// Sem auth real ainda, userId é só a string do matchmaking (ou "guest-<uuid>").
// Reaproveita o User existente por id/username, ou cria um placeholder.
async function resolveUserId(identifier: string): Promise<string> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ id: identifier }, { username: identifier }] },
  });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: { username: identifier, email: `${identifier}@guest.local` },
  });
  return created.id;
}

export async function persistMatchResult(match: Match, winnerSlot: 1 | 2): Promise<void> {
  const player1 = match.players.get(1);
  const player2 = match.players.get(2);
  if (!player1 || !player2) return;

  const player1Id = await resolveUserId(player1.userId);
  const player2Id = await resolveUserId(player2.userId);
  const winnerId = winnerSlot === 1 ? player1Id : player2Id;
  const loserId = winnerSlot === 1 ? player2Id : player1Id;

  await prisma.match.create({
    data: {
      arenaId: match.arenaId as ArenaId,
      player1Id,
      player2Id,
      winnerId,
      player1Score: match.scores[1],
      player2Score: match.scores[2],
      endedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: winnerId },
    data: { rankingPoints: { increment: WINNER_POINTS } },
  });

  await prisma.user.update({
    where: { id: loserId },
    data: { rankingPoints: { increment: LOSER_POINTS } },
  });
}
