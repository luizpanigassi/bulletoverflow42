export type CharacterId = "adventurer" | "crimson_warrior" | "explorer";

export interface CharacterOption {
  id: CharacterId;
  name: string;
  image: string;
}

export const CHARACTERS: CharacterOption[] = [
  { id: "adventurer", name: "Adventurer", image: "/characters/adventurer.png" },
  { id: "crimson_warrior", name: "Crimson Warrior", image: "/characters/crimson_warrior.png" },
  { id: "explorer", name: "Explorer", image: "/characters/explorer.png" },
];

export function randomCharacterId(): CharacterId {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]!.id;
}