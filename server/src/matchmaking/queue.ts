import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";

/** Fila de matchmaking simples (FIFO). Ver matchmaking.routes.ts pra formação do par. */
export interface QueuedPlayer {
  userId: string;
  characterId: string;
  queuedAt: number;
  socket: WebSocket;
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
