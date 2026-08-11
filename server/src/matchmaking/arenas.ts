// "arena_XX" é a chave lógica que o client mapeia pra cenas do GameManager.ARENAS.
const ARENA_IDS = ["arena_01", "arena_02", "arena_03"] as const;

export function pickRandomArenaId(): string {
  return ARENA_IDS[Math.floor(Math.random() * ARENA_IDS.length)]!;
}
