import { randomUUID } from "node:crypto";

export interface ChallengeMatch {
  matchId: string;
  arenaId: string;
  seed: number;
  slots: Record<string, 1 | 2>;
}

export interface Challenge {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted";
  createdAt: number;
  match?: ChallengeMatch;
}

const PENDING_TTL_MS = 60_000; // desafio não respondido expira
const ACCEPTED_RETENTION_MS = 30_000; // tempo pro challenger notar que foi aceito

class ChallengeStore {
  private challenges = new Map<string, Challenge>();

  create(fromUserId: string, toUserId: string): Challenge {
    this.prune();
    const challenge: Challenge = { id: randomUUID(), fromUserId, toUserId, status: "pending", createdAt: Date.now() };
    this.challenges.set(challenge.id, challenge);
    return challenge;
  }

  get(id: string): Challenge | undefined {
    this.prune();
    return this.challenges.get(id);
  }

  listFor(userId: string): Challenge[] {
    this.prune();
    return [...this.challenges.values()].filter((c) => c.fromUserId === userId || c.toUserId === userId);
  }

  remove(id: string): void {
    this.challenges.delete(id);
  }

  private prune(): void {
    const now = Date.now();
    for (const [id, c] of this.challenges) {
      const ttl = c.status === "accepted" ? PENDING_TTL_MS + ACCEPTED_RETENTION_MS : PENDING_TTL_MS;
      if (now - c.createdAt > ttl) this.challenges.delete(id);
    }
  }
}

export const challengeStore = new ChallengeStore();
