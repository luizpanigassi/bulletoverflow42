import { randomUUID } from "node:crypto";

/**
 * Fila de matchmaking simples (FIFO).
 * TODO (Etapa 4): ao ter 2 jogadores na fila, formar uma Match via MatchManager,
 * gerar match_id e remover ambos da fila.
 */
export interface QueuedPlayer {
  userId: string;
  characterId: string;
  queuedAt: number;
}

export class MatchmakingQueue {
  private queue: QueuedPlayer[] = [];

  enqueue(player: QueuedPlayer): void {
    this.queue.push(player);
  }

  dequeuePair(): [QueuedPlayer, QueuedPlayer] | null {
    if (this.queue.length < 2) return null;
    const pair = this.queue.splice(0, 2);
    const [p1, p2] = pair;
    if (!p1 || !p2) return null;
    return [p1, p2];
  }

  remove(userId: string): void {
    this.queue = this.queue.filter((p) => p.userId !== userId);
  }

  static generateMatchId(): string {
    return `match_${randomUUID()}`;
  }
}

export const matchmakingQueue = new MatchmakingQueue();
