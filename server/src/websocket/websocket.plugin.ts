import type { FastifyInstance } from "fastify";
import websocketPlugin from "@fastify/websocket";
import { matchManager } from "../matches/match-manager.js";

/**
 * Registro do WebSocket. Não deve conter lógica de gameplay (ver backend_architecture.md) —
 * apenas: aceitar conexão, identificar a qual Match/slot ela pertence, e repassar mensagens.
 */
export async function registerWebsocket(app: FastifyInstance) {
  await app.register(websocketPlugin);

  app.get("/matches/:matchId", { websocket: true }, (socket, request) => {
    const { matchId } = request.params as { matchId: string };
    const { slot } = request.query as { slot?: string };

    const match = matchManager.get(matchId);
    if (!match || (slot !== "1" && slot !== "2")) {
      socket.close(1008, "invalid match or slot");
      return;
    }

    const playerSlot = Number(slot) as 1 | 2;
    match.addPlayer({ slot: playerSlot, userId: `smoke-test-slot-${slot}`, socket });

    app.log.info(`Cliente conectado: match=${matchId} slot=${slot}`);

    socket.on("message", (raw: Buffer) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // TODO (Etapa 5+): tratar player_input, player_hit, player_wrapped,
      // powerup_collect_request de acordo com o modelo de autoridade do contrato
      // (hoje é um relay genérico, só pra validar a conexão ponta a ponta).
      app.log.debug({ data }, "mensagem recebida");
      match.relayToOpponent(playerSlot, data);
    });

    socket.on("close", () => {
      app.log.info(`Cliente desconectado: match=${matchId} slot=${slot}`);
    });
  });
}
