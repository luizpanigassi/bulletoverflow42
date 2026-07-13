import type { WebSocket } from "ws";

/**
 * Representa uma partida 1x1 em andamento.
 *
 * Modelo de autoridade:
 * - Posição, movimento, tiro (projétil) e colisão/hit: autoridade do CLIENT.
 *   O servidor apenas repassa (relay) esses eventos entre os dois sockets da
 *   partida, exceto player_hit, que ele interpreta pra emitir player_died/
 *   round_end/match_end (ver websocket.plugin.ts).
 * - Powerup: servidor decide TIMING, TIPO e POSIÇÃO (ver powerup-authority.ts);
 *   arbitra corrida de coleta (primeiro powerup_collect_request vence).
 * - Fim de partida (placar chegou a 5): autoridade do servidor, calculado a partir
 *   dos round_end derivados de cada player_hit recebido.
 */
export interface MatchPlayer {
  slot: 1 | 2;
  userId: string;
  socket: WebSocket;
}

export class Match {
  readonly matchId: string;
  readonly arenaId: string;
  readonly players: Map<1 | 2, MatchPlayer> = new Map();
  readonly scores: Record<1 | 2, number> = { 1: 0, 2: 0 };

  // powerup ativo no momento (no máximo 1 por vez, igual ao client hoje)
  activePowerupId: number | null = null;
  activePowerupType: number | null = null;
  private nextPowerupId = 1;

  matchStarted = false;
  lastHitAt = 0;

  constructor(matchId: string, arenaId: string) {
    this.matchId = matchId;
    this.arenaId = arenaId;
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

  create(matchId: string, arenaId: string): Match {
    const match = new Match(matchId, arenaId);
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
