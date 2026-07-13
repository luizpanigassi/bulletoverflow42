import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { matchmakingQueue, MatchmakingQueue, type QueuedPlayer } from "./queue.js";
import { matchManager, type Match } from "../matches/match-manager.js";
import { startPowerupLoop } from "../game/powerup-authority.js";
import { env } from "../env.js";

// Prototipo local: uma unica arena fixa. Selecao de arena fica pra depois.
// "arena_01" é a chave lógica que o client mapeia pra arena_ruins.tscn
// (ver GameManager.ARENAS em game_manager.gd) — não é o nome do arquivo.
const ARENA_ID = "arena_01";

/**
 * Fila de matchmaking via WebSocket: o client conecta e fica pendurado aqui
 * ate ter um oponente. Quando o par se forma, cada um recebe "match_found"
 * com o match_id/slot/websocket_url da partida real e a conexao da fila e
 * fechada — o client deve reconectar em websocket_url pra jogar.
 */
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
    const match = matchManager.create(MatchmakingQueue.generateMatchId(), ARENA_ID);
    startPowerupLoop(match);

    notifyMatchFound(app, p1, 1, match);
    notifyMatchFound(app, p2, 2, match);
  });
}

function notifyMatchFound(app: FastifyInstance, player: QueuedPlayer, slot: 1 | 2, match: Match) {
  app.log.info(`Match formada: match=${match.matchId} slot=${slot} userId=${player.userId}`);
  player.socket.send(
    JSON.stringify({
      type: "match_found",
      match_id: match.matchId,
      slot,
      arena_id: match.arenaId,
      websocket_url: `ws://127.0.0.1:${env.port}/matches/${match.matchId}?slot=${slot}`,
    }),
  );
  // Não fecha o socket da fila aqui: fechar logo em seguida do send() faz o
  // client correr risco de processar o frame de close antes de ler a
  // mensagem no mesmo poll. O client encerra essa conexão sozinho ao
  // reconectar em websocket_url (NetworkClient.connect_to_server fecha o
  // socket anterior antes de abrir o novo).
}
