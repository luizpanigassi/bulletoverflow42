import { useState, useEffect } from "react";
import { type ChatMessage, type ActiveUser, INITIAL_MESSAGES, INITIAL_USERS } from "../config/chat.config";

export function useChatMock(activeTab: "global" | "trade" | "dm", selectedUser: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const [users, setUsers] = useState<ActiveUser[]>(INITIAL_USERS);
    const currentUsername = localStorage.getItem("bullet_username") || "Soldado";

    // 1. Função para ENVIAR mensagem (Igual ao PRIVMSG do IRC)
    const sendMessage = (text: string) => {
        const newMsg: ChatMessage = {
            id: Math.random().toString(),
            sender: currentUsername,
            text: text.trim(),
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            isMe: true,
            channel: activeTab
        };
        setMessages((prev) => [...prev, newMsg]);
    };

    // 2. Função para BLOQUEAR/DESBLOQUEAR usuário (Comando de ignore do IRC)
    const toggleBlockUser = (usernameToBlock: string) => {
        setUsers((prev) =>
            prev.map((u) => (u.username === usernameToBlock ? { ...u, isBlocked: !u.isBlocked } : u))
        );
    };

    // 3. Simulação de Resposta do Servidor (O Mock que responde após 1.5 segundos)
    useEffect(() => {
        if (messages.length === 0 || !messages[messages.length - 1].isMe) return;

        const timeout = setTimeout(() => {
            let sender = "Thiago_WAF";
            let replyText = "Recebido na central de comando! 🛰️";

            if (activeTab === "trade") {
                sender = "João_Prisma";
                replyText = "Aceito a troca! Me chama no direct.";
            } else if (activeTab === "dm" && selectedUser) {
                sender = selectedUser;
                replyText = "Bora fechar a fila de matchmaking agora?";
            }

            // Se o usuário estiver bloqueado, o cérebro barra a mensagem (Requisito da 42)
            const isBlocked = users.find(u => u.username === sender)?.isBlocked;
            if (isBlocked) return;

            setMessages((prev) => [
                ...prev,
                {
                    id: Math.random().toString(),
                    sender,
                    text: replyText,
                    timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    isMe: false,
                    channel: activeTab
                }
            ]);
        }, 1500);

        return () => clearTimeout(timeout);
    }, [messages, activeTab, selectedUser, users]);

    // 4. Filtra as mensagens removendo as dos usuários bloqueados
    const filteredMessages = messages.filter((msg) => {
        // 1. Regra de Segurança: Esconde qualquer mensagem de quem você bloqueou
        const isBlocked = users.find((u) => u.username === msg.sender)?.isBlocked;
        if (isBlocked) return false;

        // 2. FILTRAGEM DE DM (MENSAGEM DIRETA): Só exibe se pertencer à conversa com o selectedUser atual
        if (activeTab === "dm") {
            if (msg.channel !== "dm" || !selectedUser) return false;

            // A mensagem de DM só pode aparecer se:
            // O remetente for o selectedUser (ele mandou pra você) OU 
            // Você for o remetente e o alvo (target) for o selectedUser (você mandou pra ele)
            return (
                msg.sender === selectedUser ||
                (msg.isMe && msg.target === selectedUser)
            );
        }

        // 3. FILTRAGEM DE CANAIS PÚBLICOS: Garante que canais não se misturem
        return msg.channel === activeTab;
    });


    return { users, filteredMessages, sendMessage, toggleBlockUser };
}
