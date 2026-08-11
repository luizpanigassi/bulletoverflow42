import type { WebSocket } from "ws";

/** Estado de uma partida 1x1 em andamento (ver server.md pro modelo de autoridade). */
export interface MatchPlayer {
  slot: 1 | 2;
  userId: string;
  socket: WebSocket;
}

export class Match {
  readonly matchId: string;
  readonly arenaId: string;
  readonly seed: number; // seed que o client usa pra gerar a arena
  readonly players: Map<1 | 2, MatchPlayer> = new Map();
  readonly scores: Record<1 | 2, number> = { 1: 0, 2: 0 };

  activePowerupId: number | null = null; // no máximo 1 ativo por vez
  activePowerupType: number | null = null;
  private nextPowerupId = 1;

  matchStarted = false;
  lastHitAt = 0;

  // Identidade real de cada slot, definida pelo matchmaking (resolvida via
  // token JWT ou guest) — usada pra não perder a autenticação ao conectar
  // no /matches/:matchId, que antes sempre sobrescrevia com um placeholder.
  expectedUserIds: Partial<Record<1 | 2, string>> = {};

  setExpectedUserId(slot: 1 | 2, userId: string): void {
    this.expectedUserIds[slot] = userId;
  }

  // Última posição aceita de cada jogador, pra anti-teleporte (websocket.plugin.ts).
  lastKnownPosition: Partial<Record<1 | 2, { x: number; y: number; at: number }>> = {};

  constructor(matchId: string, arenaId: string, seed: number = 0) {
    this.matchId = matchId;
    this.arenaId = arenaId;
    this.seed = seed;
  }

  addPlayer(player: MatchPlayer): void {
    this.players.set(player.slot, player);
  }

  opponentOf(slot: 1 | 2): MatchPlayer | undefined {
    return this.players.get(slot === 1 ? 2 : 1);
  }

  /** Repassa um evento recebido de um player para o oponente, sem validar conteúdo. */
  relayToOpponent(slot: 1 | 2, payload: unknown): void {
    const opponent = this.opponentOf(slot);
    if (!opponent) return;
    opponent.socket.send(JSON.stringify(payload));
  }

  broadcast(payload: unknown): void {
    const message = JSON.stringify(payload);
    for (const player of this.players.values()) {
      player.socket.send(message);
    }
  }

  registerRoundEnd(winnerSlot: 1 | 2): { matchFinished: boolean } {
    this.scores[winnerSlot] += 1;
    const matchFinished = this.scores[winnerSlot] >= 5;
    return { matchFinished };
  }

  generatePowerupId(): number {
    return this.nextPowerupId++;
  }
}

export class MatchManager {
  private matches = new Map<string, Match>();

  create(matchId: string, arenaId: string, seed: number = 0): Match {
    const match = new Match(matchId, arenaId, seed);
    this.matches.set(matchId, match);
    return match;
  }

  get(matchId: string): Match | undefined {
    return this.matches.get(matchId);
  }

  remove(matchId: string): void {
    this.matches.delete(matchId);
  }
}

export const matchManager = new MatchManager();
