/**
 * Autoridade de powerup (ver decisão de arquitetura no início do projeto):
 * - Servidor decide QUANDO (intervalo aleatório 1-10s, igual ao client hoje)
 *   e QUAL TIPO (sorteio uniforme entre os 3).
 * - Servidor NÃO decide a posição — cada client escolhe entre seus próprios
 *   spawn points locais da arena. O servidor só manda powerup_id + powerup_type.
 * - Servidor arbitra corrida de coleta: primeiro powerup_collect_request
 *   recebido para um powerup_id vence; os demais são ignorados (ver
 *   handlePowerupCollectRequest em websocket.plugin.ts).
 */

import type { Match } from "../matches/match-manager.js";

export enum PowerupType {
  RAPID_FIRE = 0,
  SPEED_BOOST = 1,
  SHIELD = 2,
}

const POWERUP_TYPES = [
  PowerupType.RAPID_FIRE,
  PowerupType.SPEED_BOOST,
  PowerupType.SHIELD,
];

export function pickRandomPowerupType(): PowerupType {
  return POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]!;
}

export function nextSpawnDelayMs(): number {
  // Mesmo intervalo do client: randf_range(1.0, 10.0) segundos
  const min = 1000;
  const max = 10000;
  return min + Math.random() * (max - min);
}

/**
 * Começa o ciclo de spawn de powerup pra uma match. Enquanto os dois
 * jogadores estiverem conectados, tenta spawnar (se não tiver nenhum
 * powerup ativo) a cada intervalo aleatório, indefinidamente.
 */
export function startPowerupLoop(match: Match): void {
  scheduleNextSpawn(match);
}

function scheduleNextSpawn(match: Match): void {
  setTimeout(() => {
    if (!match.players.has(1) || !match.players.has(2)) return;

    if (match.activePowerupId === null) {
      spawnPowerup(match);
    }

    scheduleNextSpawn(match);
  }, nextSpawnDelayMs());
}

function spawnPowerup(match: Match): void {
  const powerupId = match.generatePowerupId();
  const powerupType = pickRandomPowerupType();

  match.activePowerupId = powerupId;
  match.activePowerupType = powerupType;

  match.broadcast({ type: "powerup_spawn", powerup_id: powerupId, powerup_type: powerupType });
}
