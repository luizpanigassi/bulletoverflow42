import { useState, useEffect, useRef } from "react";
import { type ChatMessage, type ActiveUser, INITIAL_USERS } from "../config/chat.config";
import { API_HTTP_BASE } from "../config/api"; // ajuste conforme o arquivo de configuração da URL

export function useChat(activeTab: "global" | "trade" | "dm", selectedUser: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ActiveUser[]>(INITIAL_USERS);
  
  const socketRef = useRef<WebSocket | null>(null);
  const currentUsername = localStorage.getItem("bullet_username") || "Soldado";
  const token = localStorage.getItem("bullet_token");

  // 1. CONEXÃO WS: Conecta ao Fastify passando o Token JWT obrigatório exigido na API_HTTP_BASE
  useEffect(() => {
    if (!token) return;

    // Converte a URL HTTP para formato WS/WSS automaticamente
    const wsUrl = API_HTTP_BASE.replace(/^http/, "ws") + `/chat/stream?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    // Escuta as mensagens reais enviadas pelo backend (Broadcast ou DM)
    ws.onmessage = (event) => {
      try {
        const incomingMsg: ChatMessage = JSON.parse(event.data);
        
        // Regra de segurança local: Se o remetente estiver bloqueado por você, ignora a mensagem
        const isBlocked = users.find(u => u.username === incomingMsg.sender)?.isBlocked;
        if (isBlocked) return;

        setMessages((prev) => [...prev, incomingMsg]);
      } catch (err) {
        console.error("Erro ao processar mensagem recebida do servidor:", err);
      }
    };

    ws.onclose = () => console.log("[WebSocket Chat] Conexão encerrada com a base.");
    
    // Retorno de Limpeza (Cleanup): Fecha o canal de forma limpa ao sair da página para evitar vazamento
    return () => {
      ws.close();
    };
  }, [token, users]); // Reinicia a escuta de segurança se a lista de bloqueios mudar

  // 2. FUNÇÃO ENVIAR: Dispara o payload JSON real pela rede para o Fastify processar
  const sendMessage = (text: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("Sinal do WebSocket indisponível no momento.");
      return;
    }

    const payload = {
      type: "message",
      channel: activeTab,
      target: activeTab === "dm" ? selectedUser : null, // Se for DM, avisa quem é o destinatário
      text: text.trim(),
      sender: currentUsername,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    // Dispara via WebSocket em formato string
    socketRef.current.send(JSON.stringify(payload));

    // Adiciona o balão na sua própria tela imediatamente
    setMessages((prev) => [...prev, { ...payload, isMe: true, id: Math.random().toString() }]);
  };

  // 3. FUNÇÃO BLOQUEAR: Modifica o estado local (E o João pode criar a rota REST PATCH /friends no backend depois)
  const toggleBlockUser = async (usernameToBlock: string) => {
    // Alterna na tela de forma instantânea para o usuário ter o feedback visual
    setUsers((prev) =>
      prev.map((u) => (u.username === usernameToBlock ? { ...u, isBlocked: !u.isBlocked } : u))
    );
    
    // Opcional: Aqui você pode disparar um fetch local para persistir o bloqueio no Prisma do João
    // fetch(`${API_HTTP_BASE}/users/block`, { method: 'POST', body: JSON.stringify({ usernameToBlock }) });
  };

  // 4. FILTRAGEM: Exibe as mensagens da aba ativa separando os canais e as DMs
  const filteredMessages = messages.filter((msg) => {
    if (activeTab === "dm") {
      return msg.channel === "dm" && (msg.sender === selectedUser || (msg.isMe && msg.target === selectedUser));
    }
    return msg.channel === activeTab;
  });

  return { users, filteredMessages, sendMessage, toggleBlockUser };
}
