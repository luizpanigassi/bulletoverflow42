import type { FastifyInstance, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { matchmakingQueue, MatchmakingQueue, type QueuedPlayer } from "./queue.js";
import { matchManager, type Match } from "../matches/match-manager.js";
import { startPowerupLoop } from "../game/powerup-authority.js";

// "arena_XX" é a chave lógica que o client mapeia pra cenas do GameManager.ARENAS
// arenas entram em aleatório

const ARENA_IDS = ["arena_01", "arena_02", "arena_03"] as const;

function pickRandomArenaId(): string {
  return ARENA_IDS[Math.floor(Math.random() * ARENA_IDS.length)]!;
}

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
  app.get("/matchmaking/queue", { websocket: true }, (socket, request) => {
    const { userId, characterId } = request.query as { userId?: string; characterId?: string };

    const player: QueuedPlayer = {
      userId: userId || `guest-${randomUUID()}`,
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
    app.log.info(`Match formada: match=${match.matchId} arena=${match.arenaId} seed=${match.seed}`);
    startPowerupLoop(match);

    notifyMatchFound(app, request, p1, 1, match);
    notifyMatchFound(app, request, p2, 2, match);
  });
}

function notifyMatchFound(app: FastifyInstance, request: FastifyRequest, player: QueuedPlayer, slot: 1 | 2, match: Match) {
  app.log.info(`Match formada: match=${match.matchId} slot=${slot} userId=${player.userId}`);
  player.socket.send(
    JSON.stringify({
      type: "match_found",
      match_id: match.matchId,
      slot,
      arena_id: match.arenaId,
      seed: match.seed,
      websocket_url: buildWebsocketUrl(request, match.matchId, slot),
    }),
  );
  // Não fecha o socket aqui: o client encerra sozinho ao reconectar em websocket_url.
}
