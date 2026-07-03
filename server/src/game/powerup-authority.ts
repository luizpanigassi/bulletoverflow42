/**
 * Autoridade de powerup:
 * - Servidor decide QUANDO (intervalo aleatório 1-10s, igual ao client hoje),
 *   QUAL TIPO (sorteio uniforme entre os 3) e a POSIÇÃO — PowerupState.from_dict()
 *   no client lê position_x/position_y sem fallback (ver
 *   client/scripts/states/powerup_state.gd), então sem isso o powerup nunca
 *   chega a ser criado. A lista abaixo espelha os Marker2D do grupo
 *   "powerup_spawns" em client/scenes/arenas/arena_ruins.tscn (única arena
 *   do protótipo).
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

interface Position {
  x: number;
  y: number;
}

// Espelha os Marker2D do grupo "powerup_spawns" em arena_ruins.tscn.
const ARENA_RUINS_SPAWN_POINTS: Position[] = [
  { x: 303, y: 110 },
  { x: 398, y: 160 },
  { x: 625, y: 144 },
  { x: 816, y: 125 },
  { x: 835, y: 239 },
  { x: 194, y: 158 },
  { x: 1008, y: 144 },
  { x: 64, y: 157 },
  { x: 113, y: 253 },
  { x: 448, y: 272 },
  { x: 593, y: 238 },
  { x: 398, y: 160 },
  { x: 111, y: 351 },
  { x: 275, y: 324 },
  { x: 370, y: 322 },
  { x: 528, y: 382 },
  { x: 720, y: 286 },
  { x: 1152, y: 190 },
  { x: 177, y: 445 },
  { x: 162, y: 591 },
  { x: 370, y: 446 },
  { x: 290, y: 557 },
  { x: 415, y: 577 },
  { x: 1167, y: 350 },
  { x: 1023, y: 354 },
  { x: 912, y: 348 },
  { x: 1134, y: 465 },
  { x: 1152, y: 590 },
  { x: 1055, y: 573 },
  { x: 750, y: 383 },
  { x: 530, y: 510 },
  { x: 673, y: 495 },
  { x: 866, y: 463 },
  { x: 592, y: 591 },
  { x: 928, y: 575 },
  { x: 770, y: 575 },
];

export function pickRandomPowerupType(): PowerupType {
  return POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]!;
}

function pickRandomPosition(): Position {
  return ARENA_RUINS_SPAWN_POINTS[Math.floor(Math.random() * ARENA_RUINS_SPAWN_POINTS.length)]!;
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
  const position = pickRandomPosition();

  match.activePowerupId = powerupId;
  match.activePowerupType = powerupType;

  match.broadcast({
    type: "powerup_spawn",
    powerup_id: powerupId,
    powerup_type: powerupType,
    position_x: position.x,
    position_y: position.y,
  });
}
