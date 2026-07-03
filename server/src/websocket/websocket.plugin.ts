import type { FastifyInstance } from "fastify";
import websocketPlugin from "@fastify/websocket";
import { matchManager, type Match } from "../matches/match-manager.js";

/**
 * Registro do WebSocket: aceita a conexão, identifica a Match/slot, e repassa
 * mensagens. player_hit é o único tipo tratado por conteúdo hoje — o servidor
 * aceita sem validação (sem anti-cheat, decisão consciente do time) e é quem
 * emite player_died/round_end/match_end, não o client.
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

    // Só o primeiro round_start vem do servidor (dispara o spawn dos players
    // via game_manager.gd). Os próximos rounds cada client dispara sozinho
    // localmente ao terminar o round anterior (reset_round() em game_manager.gd).
    if (match.players.size === 2 && !match.matchStarted) {
      match.matchStarted = true;
      match.broadcast({ type: "match_start", match_id: match.matchId });
      match.broadcast({ type: "round_start" });
    }

    socket.on("message", (raw: Buffer) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }

      app.log.debug({ data }, "mensagem recebida");

      if (data.type === "player_hit") {
        handlePlayerHit(app, match, data);
        return;
      }

      if (data.type === "powerup_collect_request") {
        handlePowerupCollectRequest(app, match, data);
        return;
      }

      if (data.type === "player_input") {
        // TODO (Etapa 7+): validação de deslocamento máximo (anti-teleporte).
        handlePlayerInput(match, playerSlot, data);
        return;
      }

      match.relayToOpponent(playerSlot, data);
    });

    socket.on("close", () => {
      app.log.info(`Cliente desconectado: match=${matchId} slot=${slot}`);
    });
  });
}

// Janela de debounce pra ignorar player_hit duplicado: como agora os dois
// clients têm sua própria cópia local do projétil (um pra si, um relayado
// pro oponente via projectile_spawn), os dois podem detectar a mesma
// colisão de forma independente e mandar player_hit quase ao mesmo tempo.
// Um round legítimo seguinte só acontece segundos depois (round_result +
// countdown no client), então 1s é uma folga segura sem bloquear hits reais.
const HIT_DEBOUNCE_MS = 1000;

function handlePlayerHit(app: FastifyInstance, match: Match, data: Record<string, unknown>) {
  const now = Date.now();
  if (now - match.lastHitAt < HIT_DEBOUNCE_MS) {
    return;
  }
  match.lastHitAt = now;

  const targetSlot = Number(data.target_slot) as 1 | 2;
  const shooterSlot = Number(data.shooter_slot) as 1 | 2;

  app.log.info(`player_hit: match=${match.matchId} shooter=${shooterSlot} target=${targetSlot}`);

  match.broadcast({ type: "player_died", player_slot: targetSlot });

  const { matchFinished } = match.registerRoundEnd(shooterSlot);
  match.broadcast({ type: "round_end", winner_slot: shooterSlot });

  if (matchFinished) {
    app.log.info(`match_end: match=${match.matchId} winner=${shooterSlot}`);
    match.broadcast({
      type: "match_end",
      player1_score: match.scores[1],
      player2_score: match.scores[2],
      winner_slot: shooterSlot,
    });
  }
}

// Autoridade de posição é do client, sem resimulação (ver Match doc-comment)
// — então só repassa position_x/position_y como "player_state" pro OPONENTE.
// Não ecoa de volta pra quem mandou: NetworkPlayerSynchronizer.reconcile()
// reaplica (replay) os inputs em buffer sempre que recebe player_state do
// próprio slot, o que faz sentido só quando o servidor resimula e pode
// divergir da predição local — como aqui ele nunca diverge (só devolveria a
// posição que o próprio client acabou de mandar), ecoar de volta faz o
// replay reaplicar movimento que já tinha sido aplicado, dobrando-o a cada
// frame (o personagem local "voa" pela tela).
function handlePlayerInput(match: Match, slot: 1 | 2, data: Record<string, unknown>) {
  match.relayToOpponent(slot, {
    type: "player_state",
    player_slot: slot,
    position_x: data.position_x,
    position_y: data.position_y,
    velocity_x: 0,
    velocity_y: 0,
    aim_x: data.aim_x,
    aim_y: data.aim_y,
    last_processed_seq: data.seq ?? 0,
  });
}

function handlePowerupCollectRequest(app: FastifyInstance, match: Match, data: Record<string, unknown>) {
  const powerupId = Number(data.powerup_id);
  const playerSlot = Number(data.player_slot) as 1 | 2;

  // Corrida: só o primeiro pedido pra esse powerup_id ainda ativo vence.
  // Um pedido atrasado (powerup já coletado ou nunca existiu) é ignorado.
  if (match.activePowerupId !== powerupId) {
    return;
  }

  const powerupType = match.activePowerupType;
  match.activePowerupId = null;
  match.activePowerupType = null;

  app.log.info(`powerup coletado: match=${match.matchId} slot=${playerSlot} powerup_id=${powerupId}`);

  match.broadcast({ type: "powerup_collected", player_slot: playerSlot, powerup_type: powerupType });
  match.broadcast({ type: "powerup_removed", powerup_id: powerupId });
}
