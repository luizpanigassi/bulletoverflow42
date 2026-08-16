export interface ChallengeItem {
  id: string;
  direction: "sent" | "received";
  otherUsername: string;
  status: "pending" | "accepted";
  match: { matchId: string; arenaId: string; seed: number; slot: 1 | 2; player1Username: string; player2Username: string } | null;
}

export interface MatchHistoryItem {
  id: string;
  opponent: string;
  yourScore: number;
  opponentScore: number;
  result: "VITÓRIA" | "DERROTA";
  date: string;
  arena: string;
}

export interface Friend {
  id: string;
  username: string;
  avatarUrl: string | null;
  rankingPoints: number;
  online: boolean;
}

export interface PendingRequest {
  friendshipId: string;
  requester: Friend;
}

export interface ProfileData {
  id: string;
  username: string;
  avatarUrl: string | null;
  rankingPoints: number;
  matchesPlayed: number;
  wins: number;
  twoFactorEnabled: boolean;
}

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// Conquistas derivadas direto de `wins` (que já vem persistido via partidas
// reais no banco) — não precisa de tabela própria.
export const ACHIEVEMENT_THRESHOLDS = [1, 5, 10, 50, 100];
