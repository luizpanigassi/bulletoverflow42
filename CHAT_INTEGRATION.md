# 🛰️ Guia de Integração do Chat Real (React 19 ↔ Fastify 5 WebSockets)

Este documento atua como o **contrato técnico e mapa de implementação** projetado pela **Tech Lead (Lilian)** para mover o sistema de comunicação do portal do modo simulado (Mock) para conexões de rede em tempo real completas.

A arquitetura herda os conceitos de gerenciamento de canais e comandos do projeto **ft_irc**, adaptando a camada de transporte para pacotes estruturados em JSON via WebSockets nativos da Web.

---

## 1. 🗄️ Camada de Persistência & Banco de Dados (Para: João)

Para suportar canais abertos, histórico persistente e a feature obrigatória de bloqueio de usuários, adicione os seguintes modelos ao arquivo `server/prisma/schema.prisma` e execute as migrações:

```prisma
// server/prisma/schema.prisma

model ChatMessage {
  id        String   @id @default(uuid())
  senderId  String
  sender    User     @relation("SentChatMessages", fields: [senderId], references: [id], onDelete: Cascade)
  channel   String   // "global" | "trade" | "dm"
  targetId  String?  // Nulo para canais públicos, preenchido com o User.id destino para DMs
  target    User?    @relation("ReceivedChatMessages", fields: [targetId], references: [id], onDelete: Cascade)
  text      String
  timestamp DateTime @default(now())

  @@index([channel])
  @@index([senderId])
}

model UserBlock {
  id          String   @id @default(uuid())
  blockerId   String   // Quem efetuou o comando de bloqueio
  blocker     User     @relation("UserBlocker", fields: [blockerId], references: [id], onDelete: Cascade)
  blockedId   String   // O alvo do bloqueio (quem será silenciado)
  blocked     User     @relation("UserBlocked", fields: [blockedId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([blockerId, blockedId]) // Impede duplicidade de bloqueios no par
}
```

*Nota: Não esqueça de rodar `npm run prisma:generate` e `npm run prisma:migrate` para atualizar o client gerado.*

---

## 2. 🛡️ Segurança, Infraestrutura & WAF (Para: Thiago)

Para evitar que o motor de inspeção do WAF bloqueie os fluxos contínuos de mensagens em JSON por falsos positivos, atualize o arquivo de overrides do ModSecurity no container do proxy:

```nginx
# docker/waf/modsecurity-override.conf

# Afrouxa a inspeção e habilita processamento JSON para a nova rota de streaming do chat
SecRule REQUEST_URI "@beginsWith /chat/stream" \
    "id:900003,phase:1,pass,nolog,ctl:ruleEngine=DetectionOnly,ctl:requestBodyProcessor=JSON"
```

Certifique-se de que os templates do Nginx estejam preservando corretamente o upgrade de conexão para WebSockets (`Connection "Upgrade"` e `Upgrade $http_upgrade`).

---

## 3. ⚙️ Rotas do Servidor & Lógica de Redirecionamento (Para: João/Thiago)

Crie o arquivo `server/src/chat/chat.routes.ts`. A rota deve ser **pública no nível HTTP**, mas deve validar o token JWT de sessão imediatamente na abertura do túnel WebSocket:

```typescript
// server/src/chat/chat.routes.ts
import type { FastifyInstance } from "fastify";
import { verifySession } from "../auth/jwt.js";
import { prisma } from "../database/prisma.js";

// Mapa global em memória para gerenciar conexões ativas: UserId -> Socket do Cliente
export const activeChatClients = new Map<string, any>();

export async function registerChatRoutes(app: FastifyInstance) {
  app.get("/chat/stream", { websocket: true }, (connection, request) => {
    
    // 1. Extração e validação do token JWT passado por Query String pelo React
    const token = (request.query as any).token;
    const session = token ? verifySession(token) : null;

    if (!session) {
      connection.socket.close(1008, "Acesso negado: Token ausente ou inválido");
      return;
    }

    const userId = session.userId;
    activeChatClients.set(userId, connection.socket);

    // 2. Escuta de eventos recebidos do frontend (Semelhante ao PRIVMSG do IRC)
    connection.socket.on("message", async (rawMessage) => {
      try {
        const payload = JSON.parse(rawMessage.toString());
        const { channel, target, text, sender, timestamp } = payload;

        if (!text?.trim()) return;

        // Bloco de controle para Mensagens Privadas (DM)
        if (channel === "dm" && target) {
          const targetUser = await prisma.user.findUnique({ where: { username: target } });
          if (!targetUser) return;

          // REGRA DE SEGURANÇA OBRIGATÓRIA: Verifica se o alvo bloqueou o remetente
          const isBlocked = await prisma.userBlock.findFirst({
            where: { blockerId: targetUser.id, blockedId: userId }
          });
          
          if (isBlocked) return; // Drop silencioso do pacote se houver bloqueio persistido

          // Envia o payload exclusivamente para o socket do destinatário, se ele estiver online
          const targetSocket = activeChatClients.get(targetUser.id);
          if (targetSocket) {
            targetSocket.send(JSON.stringify({ ...payload, isMe: false }));
          }
          return;
        }

        // Bloco de controle para Canais Públicos (Global / Trade)
        // Faz o broadcast para todas as conexões ativas na RAM (Estilo IRC)
        for (const [clientUserId, clientSocket] of activeChatClients.entries()) {
          if (clientUserId === userId) continue; // Ignora o próprio remetente

          // Opcional: Checa se o receptor bloqueou o remetente antes de entregar
          const receptorBlocked = await prisma.userBlock.findFirst({
            where: { blockerId: clientUserId, blockedId: userId }
          });

          if (!receptorBlocked) {
            clientSocket.send(JSON.stringify({ ...payload, isMe: false }));
          }
        }

      } catch (err) {
        console.error("Falha ao processar payload do chat:", err);
      }
    });

    // Remove a referência do socket da RAM ao desconectar (evita instâncias zumbis)
    connection.socket.on("close", () => {
      activeChatClients.delete(userId);
    });
  });
}
```

---

## 4. 🎛️ Ativação Final no Cliente Frontend (Para: Lilian)

Assim que as rotas acima estiverem consolidadas no servidor, substituir o conteúdo `src/hooks/useChatMock.ts` por `src/hooks/useChat.ts`