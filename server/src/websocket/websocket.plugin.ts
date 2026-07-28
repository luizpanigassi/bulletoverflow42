import type { FastifyInstance } from "fastify";
import websocketPlugin from "@fastify/websocket";
import { matchManager, type Match } from "../matches/match-manager.js";
import { persistMatchResult } from "../matches/persist-match-result.js";

/** Aceita a conexão, identifica a Match/slot, e roteia mensagens de gameplay. */
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

    // Só o 1º round_start vem do servidor; os seguintes o client dispara sozinho.
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
        handlePlayerInput(match, playerSlot, data);
        return;
      }

      match.relayToOpponent(playerSlot, data);
    });

    socket.on("close", () => {
      app.log.info(`Cliente desconectado: match=${matchId} slot=${slot}`);
      match.relayToOpponent(playerSlot, { type: "opponent_disconnected" });
    });
  });
}

// Debounce pra ignorar player_hit duplicado (os dois clients têm cópia
// própria do projétil e podem reportar a mesma colisão quase ao mesmo tempo).
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

  // Libera o powerup ativo mesmo se ninguém coletou, senão o loop trava.
  match.activePowerupId = null;
  match.activePowerupType = null;

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

    // Não bloqueia o broadcast acima; erro de banco não deve travar o gameplay.
    persistMatchResult(match, shooterSlot).catch((err) => {
      app.log.error({ err }, `Falha ao persistir resultado da match=${match.matchId}`);
    });
  }
}

// Dash (850px/s) é o movimento mais rápido do jogo; 2x de folga por ser
// checagem grosseira (anti-teleporte), não anti-cheat fino.
const MAX_PLAUSIBLE_SPEED_PX_PER_SEC = 850 * 2;
const MIN_ELAPSED_SEC = 1 / 60;

function isDisplacementPlausible(match: Match, slot: 1 | 2, x: number, y: number): boolean {
  const now = Date.now();
  const last = match.lastKnownPosition[slot];

  if (!last) {
    match.lastKnownPosition[slot] = { x, y, at: now };
    return true;
  }

  const elapsedSec = Math.max((now - last.at) / 1000, MIN_ELAPSED_SEC);
  const distance = Math.hypot(x - last.x, y - last.y);
  const maxDistance = MAX_PLAUSIBLE_SPEED_PX_PER_SEC * elapsedSec;

  if (distance > maxDistance) {
    return false; // não atualiza a baseline com uma posição rejeitada
  }

  match.lastKnownPosition[slot] = { x, y, at: now };
  return true;
}

function handlePlayerInput(match: Match, slot: 1 | 2, data: Record<string, unknown>) {
  const positionX = Number(data.position_x);
  const positionY = Number(data.position_y);

  if (!isDisplacementPlausible(match, slot, positionX, positionY)) {
    return;
  }

  // Só relay pro oponente, nunca broadcast: ecoar de volta faria o
  // reconcile() do client reaplicar o movimento e dobrá-lo.
  match.relayToOpponent(slot, {
    type: "player_state",
    player_slot: slot,
    position_x: positionX,
    position_y: positionY,
    velocity_x: 0,
    velocity_y: 0,
    aim_x: data.aim_x,
    aim_y: data.aim_y,
    dash: Boolean(data.dash),
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
