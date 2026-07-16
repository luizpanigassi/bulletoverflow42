/**
 * Autoridade de powerup:
 * - Servidor decide QUANDO (intervalo aleatório 1-10s, igual ao client hoje),
 *   QUAL TIPO (sorteio uniforme entre os 3) e a POSIÇÃO — PowerupState.from_dict()
 *   no client lê position_x/position_y sem fallback (ver
 *   client/scripts/states/powerup_state.gd), então sem isso o powerup nunca
 *   chega a ser criado. As listas abaixo espelham os Marker2D do grupo
 *   "powerup_spawns" de cada arena em client/scenes/arenas/*.tscn — a
 *   posição sorteada tem que vir da arena da própria match (match.arenaId),
 *   já que o matchmaking sorteia entre as 3 arenas.
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

// Espelha os Marker2D do grupo "powerup_spawns" em arena_badlands.tscn.
const ARENA_BADLANDS_SPAWN_POINTS: Position[] = [
  { x: 52, y: 95 },
  { x: 146, y: 103 },
  { x: 240, y: 91 },
  { x: 333, y: 94 },
  { x: 412, y: 92 },
  { x: 501, y: 78 },
  { x: 601, y: 73 },
  { x: 701, y: 81 },
  { x: 779, y: 87 },
  { x: 873, y: 91 },
  { x: 966, y: 83 },
  { x: 1066, y: 91 },
  { x: 1144, y: 97 },
  { x: 1238, y: 101 },
  { x: 36, y: 160 },
  { x: 130, y: 168 },
  { x: 224, y: 156 },
  { x: 317, y: 159 },
  { x: 396, y: 157 },
  { x: 491, y: 177 },
  { x: 596, y: 179 },
  { x: 701, y: 163 },
  { x: 767, y: 205 },
  { x: 845, y: 155 },
  { x: 959, y: 207 },
  { x: 1047, y: 204 },
  { x: 1144, y: 202 },
  { x: 1227, y: 180 },
  { x: 33, y: 233 },
  { x: 130, y: 286 },
  { x: 224, y: 274 },
  { x: 317, y: 277 },
  { x: 396, y: 275 },
  { x: 491, y: 295 },
  { x: 596, y: 297 },
  { x: 701, y: 281 },
  { x: 767, y: 323 },
  { x: 844, y: 230 },
  { x: 948, y: 285 },
  { x: 1040, y: 257 },
  { x: 1135, y: 277 },
  { x: 1220, y: 275 },
  { x: 38, y: 298 },
  { x: 117, y: 404 },
  { x: 211, y: 392 },
  { x: 304, y: 395 },
  { x: 383, y: 393 },
  { x: 465, y: 367 },
  { x: 498, y: 481 },
  { x: 713, y: 379 },
  { x: 765, y: 409 },
  { x: 831, y: 348 },
  { x: 935, y: 403 },
  { x: 1023, y: 437 },
  { x: 1136, y: 372 },
  { x: 1207, y: 393 },
  { x: 25, y: 416 },
  { x: 313, y: 480 },
  { x: 407, y: 491 },
  { x: 410, y: 595 },
  { x: 675, y: 543 },
  { x: 775, y: 586 },
  { x: 812, y: 484 },
  { x: 898, y: 579 },
  { x: 1007, y: 596 },
  { x: 1133, y: 457 },
  { x: 1203, y: 506 },
  { x: 51, y: 493 },
  { x: 131, y: 501 },
  { x: 200, y: 468 },
  { x: 251, y: 527 },
];

// Espelha os Marker2D do grupo "powerup_spawns" em arena_catacombs.tscn.
const ARENA_CATACOMBS_SPAWN_POINTS: Position[] = [
  { x: 59, y: 139 },
  { x: 153, y: 147 },
  { x: 247, y: 135 },
  { x: 340, y: 138 },
  { x: 419, y: 136 },
  { x: 508, y: 122 },
  { x: 608, y: 117 },
  { x: 708, y: 125 },
  { x: 786, y: 131 },
  { x: 880, y: 135 },
  { x: 973, y: 127 },
  { x: 1073, y: 135 },
  { x: 1151, y: 141 },
  { x: 1245, y: 145 },
  { x: 235, y: 251 },
  { x: 231, y: 200 },
  { x: 93, y: 607 },
  { x: 438, y: 206 },
  { x: 543, y: 183 },
  { x: 609, y: 219 },
  { x: 708, y: 208 },
  { x: 768, y: 289 },
  { x: 806, y: 186 },
  { x: 973, y: 186 },
  { x: 1041, y: 221 },
  { x: 1043, y: 570 },
  { x: 1137, y: 603 },
  { x: 189, y: 601 },
  { x: 145, y: 352 },
  { x: 242, y: 339 },
  { x: 322, y: 344 },
  { x: 397, y: 343 },
  { x: 525, y: 305 },
  { x: 603, y: 341 },
  { x: 708, y: 325 },
  { x: 774, y: 367 },
  { x: 851, y: 274 },
  { x: 955, y: 329 },
  { x: 1047, y: 301 },
  { x: 1142, y: 321 },
  { x: 1227, y: 319 },
  { x: 45, y: 342 },
  { x: 97, y: 373 },
  { x: 333, y: 643 },
  { x: 311, y: 440 },
  { x: 374, y: 410 },
  { x: 472, y: 412 },
  { x: 512, y: 531 },
  { x: 720, y: 424 },
  { x: 629, y: 522 },
  { x: 869, y: 388 },
  { x: 942, y: 458 },
  { x: 1032, y: 372 },
  { x: 521, y: 624 },
  { x: 1155, y: 384 },
  { x: 37, y: 604 },
  { x: 316, y: 503 },
  { x: 414, y: 535 },
  { x: 637, y: 606 },
  { x: 743, y: 592 },
  { x: 819, y: 528 },
  { x: 905, y: 623 },
  { x: 995, y: 616 },
  { x: 1124, y: 546 },
  { x: 1210, y: 550 },
  { x: 58, y: 537 },
  { x: 138, y: 545 },
  { x: 207, y: 512 },
  { x: 258, y: 571 },
];

const ARENA_SPAWN_POINTS: Record<string, Position[]> = {
  arena_01: ARENA_RUINS_SPAWN_POINTS,
  arena_02: ARENA_BADLANDS_SPAWN_POINTS,
  arena_03: ARENA_CATACOMBS_SPAWN_POINTS,
};

export function pickRandomPowerupType(): PowerupType {
  return POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]!;
}

function pickRandomPosition(arenaId: string): Position {
  const spawnPoints = ARENA_SPAWN_POINTS[arenaId] ?? ARENA_RUINS_SPAWN_POINTS;
  return spawnPoints[Math.floor(Math.random() * spawnPoints.length)]!;
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
  const position = pickRandomPosition(match.arenaId);

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
