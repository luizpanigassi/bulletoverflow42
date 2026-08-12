import type { FastifyInstance, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { matchmakingQueue, MatchmakingQueue, type QueuedPlayer } from "./queue.js";
import { matchManager, type Match } from "../matches/match-manager.js";
import { startPowerupLoop } from "../game/powerup-authority.js";
import { verifySession } from "../auth/jwt.js";
import { pickRandomArenaId } from "./arenas.js";
import { prisma } from "../database/prisma.js";

/**
 * Monta a URL de WebSocket da partida a partir dos headers da própria requisição,
 * em vez de hardcodar host/porta. Assim funciona tanto em dev local (sem proxy)
 * quanto atrás do WAF/Nginx com TLS (wss:// + host público).
 */
function buildWebsocketUrl(request: FastifyRequest, matchId: string, slot: 1 | 2): string {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const proto = forwardedProto === "https" ? "wss" : "ws";

  const forwardedHost = request.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ?? request.headers.host;

  return `${proto}://${host}/matches/${matchId}?slot=${slot}`;
}

/** Fila via WebSocket: forma o par e manda "match_found" com o websocket_url da partida. */
export async function registerMatchmaking(app: FastifyInstance) {
  app.get("/matchmaking/queue", { websocket: true }, async (socket, request) => {
    const { userId, characterId, token } = request.query as {
      userId?: string;
      characterId?: string;
      token?: string;
    };

    // Com token: o id e o nome de exibição vêm da sessão validada (JWT guarda só o id
    // do banco no "sub", então o username real precisa de uma consulta à parte) —
    // nunca do que o client afirma. Sem token: mantém o fluxo guest de antes.
    let resolvedUserId: string;
    let resolvedUsername: string;
    if (token) {
      const session = verifySession(token);
      if (!session) {
        socket.close(1008, "invalid token");
        return;
      }
      resolvedUserId = session.userId;
      const user = await prisma.user.findUnique({ where: { id: resolvedUserId }, select: { username: true } });
      resolvedUsername = user?.username ?? resolvedUserId;
    } else {
      resolvedUserId = userId || `guest-${randomUUID()}`;
      resolvedUsername = resolvedUserId;
    }

    const player: QueuedPlayer = {
      userId: resolvedUserId,
      username: resolvedUsername,
      characterId: characterId || "adventurer",
      queuedAt: Date.now(),
      socket,
    };

    matchmakingQueue.enqueue(player);
    app.log.info(`Jogador entrou na fila de matchmaking: ${player.userId}`);

    socket.on("close", () => matchmakingQueue.remove(player.userId));

    const pair = matchmakingQueue.dequeuePair();
    if (!pair) return;

    const [p1, p2] = pair;
    const match = matchManager.create(MatchmakingQueue.generateMatchId(), pickRandomArenaId(), Math.floor(Math.random() * 2147483647));
    match.setExpectedUserId(1, p1.userId);
    match.setExpectedUserId(2, p2.userId);
    app.log.info(`Match formada: match=${match.matchId} arena=${match.arenaId} seed=${match.seed}`);
    startPowerupLoop(match);

    notifyMatchFound(app, request, p1, 1, match, p1.username, p2.username, p1.characterId, p2.characterId);
    notifyMatchFound(app, request, p2, 2, match, p1.username, p2.username, p1.characterId, p2.characterId);
  });
}

function notifyMatchFound(app: FastifyInstance, request: FastifyRequest, player: QueuedPlayer, slot: 1 | 2, match: Match, player1UserName: string, player2UserName: string, player1CharacterId: string, player2CharacterId: string) {
  app.log.info(`Match formada: match=${match.matchId} slot=${slot} userId=${player.userId}`);
  player.socket.send(
    JSON.stringify({
      type: "match_found",
      match_id: match.matchId,
      slot,
      arena_id: match.arenaId,
      seed: match.seed,
      websocket_url: buildWebsocketUrl(request, match.matchId, slot),
      player1_username: player1UserName,
      player2_username: player2UserName,
      player1_character_id: player1CharacterId,
      player2_character_id: player2CharacterId,
    }),
  );
  // Não fecha o socket aqui: o client encerra sozinho ao reconectar em websocket_url.
}
