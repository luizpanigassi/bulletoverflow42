
export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  channel: "global" | "trade" | "dm";
}

export interface ActiveUser {
  username: string;
  online: boolean;
  isBlocked: boolean;
}

// Mensagens iniciais para o chat não começar totalmente vazio
export const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "1", sender: "Luiz_Ninja", text: "Alguém pro PvP 1v1 na Arena 1?", timestamp: "14:20", isMe: false, channel: "global" },
  { id: "2", sender: "Thiago_WAF", text: "Regras do ModSecurity atualizadas no container!", timestamp: "14:21", isMe: false, channel: "global" },
  { id: "3", sender: "João_Prisma", text: "Troco skin do Space Marine por Adventurer", timestamp: "14:15", isMe: false, channel: "trade" },
];

export const INITIAL_USERS: ActiveUser[] = [
  { username: "Luiz_Ninja", online: true, isBlocked: false },
  { username: "Thiago_WAF", online: true, isBlocked: false },
  { username: "João_Prisma", online: false, isBlocked: false },
  { username: "Troll_42", online: true, isBlocked: false },
];
