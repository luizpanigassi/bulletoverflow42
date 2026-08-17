# Conexão do server com o banco de dados

Documento focado especificamente em como o `server/` se conecta e conversa
com o PostgreSQL. Para o resto do funcionamento do server (WebSocket,
matchmaking, autoridade de gameplay), ver `server.md`.

## Camada de acesso: Prisma

Todo acesso ao banco passa pelo **Prisma Client**, nunca por SQL cru ou outro
driver. Uma única instância é criada em `server/src/database/prisma.ts`:

```ts
export const prisma = new PrismaClient();
```

Essa instância é importada e reaproveitada por todos os módulos
(`matches/persist-match-result.ts`, `users/users.routes.ts`,
`leaderboard/leaderboard.routes.ts`). Não existe uma instância por request —
isso evitaria esgotar o pool de conexões do Postgres, principalmente em dev,
onde `tsx watch` reinicia o processo a cada mudança de arquivo.

## String de conexão (`DATABASE_URL`)

- Definida em `server/.env` (nunca commitado — ver `server/.env.example`).
- Formato: `postgresql://<user>:<senha>@<host>:5432/<database>?schema=public`.
- `env.ts` só lê `process.env.DATABASE_URL` — não valida formato nem testa a
  conexão no boot do server. Se o Postgres estiver fora do ar, o erro só
  aparece na primeira query real feita por uma request.
- O backend **não sobe nem gerencia o Postgres** — só espera uma URL válida
  apontando pra um banco já de pé. Quem sobe o banco é o ambiente:

| Ambiente | Quem sobe o Postgres | `DATABASE_URL` aponta pra |
|---|---|---|
| Dev local | Você mesmo (ex: `docker run postgres` manual, ou instância local) | `localhost:5432`, banco `bullet_overflow`, user `user` (ver `.env.example`) |
| Docker Compose da infra (`docker/docker-compose.app.yml`) | Serviço `postgres` do próprio compose (`postgres:16-alpine`) | `postgres:5432` (nome do serviço, resolvido pela rede Docker `transcendence_net`), banco/user `transcendence` — a URL é montada direto no `environment:` do serviço `backend`, sobrescrevendo o `.env` |

## Onde os dados ficam persistidos de verdade

- Fisicamente, é o próprio processo do Postgres que grava em disco (não é
  responsabilidade do server/Prisma).
- No Docker Compose da infra, o serviço `postgres` monta um **named volume**:
  ```yaml
  volumes:
    - postgres_data:/var/lib/postgresql/data
  ```
  Esse volume é gerenciado pelo Docker no host onde o `docker compose up`
  roda. Sobrevive a `docker compose down` e a rebuilds da imagem — só é
  apagado com `docker compose down -v` (remove volumes) ou remoção manual do
  volume.
- Sem esse volume (ou em um Postgres de dev feito só por `docker run`
  sem `-v`), os dados somem assim que o container do Postgres é removido.

## Schema (`server/prisma/schema.prisma`)

| Model | Campos principais | Papel |
|---|---|---|
| `User` | `id`, `username`, `email` (únicos), `passwordHash` (nulo se só login via 42), `avatarUrl`, `fortyTwoId` (único, nulo se nunca logou via OAuth), `rankingPoints` (default 0), `twoFactorEnabled` (default false, liga/desliga 2FA por conta), `twoFactorCode`/`twoFactorCodeExpiresAt`, `lastSeenAt` (heartbeat de status online) | Conta do jogador — cobre login local (email+senha) e OAuth 42 no mesmo model. |
| `Friendship` | `requesterId`, `addresseeId`, `status` (`PENDING`/`ACCEPTED`/`BLOCKED`), único por par | Relação de amizade entre dois `User`. |
| `Match` | `arenaId` (enum `arena_01`/`arena_02`/`arena_03`), `player1Id`/`player2Id`/`winnerId`, `player1Score`/`player2Score`, `startedAt`/`endedAt` | Histórico de partida. |

Migrations ficam em `server/prisma/migrations/`:

- `20260720121009_init` — cria as 3 tabelas acima.
- `20260806003953_add_two_factor_auth` — adiciona `twoFactorCode`/`twoFactorCodeExpiresAt`.
- `20260806032445_add_last_seen_at` — adiciona `lastSeenAt` (status online via heartbeat).
- `20260814050000_add_two_factor_enabled` — adiciona `twoFactorEnabled` (2FA vira configuração por conta, não checkbox por login).

Comandos relevantes
(`server/package.json`):

```
npm run prisma:generate   # gera o Prisma Client a partir do schema
npm run prisma:migrate    # aplica/gera migration em dev (prisma migrate dev)
npm run prisma:studio     # abre o Prisma Studio (GUI pra inspecionar dados)
```

`prisma:generate` precisa rodar de novo sempre que `schema.prisma` mudar, e
depois de um `npm install` limpo — o client gerado fica em
`node_modules/.prisma`, fora do controle de versão.

## Quando o server realmente lê/escreve no banco

Durante o gameplay em si (WebSocket), **nada** toca o banco — tudo fica em
memória no objeto `Match` (posições, placar, powerup ativo). O banco só
entra em cena em três pontos:

1. **Fim de partida** — `websocket.plugin.ts` chama
   `persistMatchResult()` (`matches/persist-match-result.ts`) no evento
   `match_end`, que roda, **por slot** (1 e 2), a query de `resolveUserId`, e
   depois duas queries finais:
   - `prisma.user.findFirst({ where: { OR: [{ id: identifier }, { username: identifier }] } })`
     — tenta achar um `User` existente pelo `userId`/`username` vindo do
     matchmaking;
   - se não achar: `prisma.user.create({ data: { username: identifier, email: \`${identifier}@guest.local\` } })`
     — cria um `User` placeholder (stub necessário porque a #33, login real,
     ainda não existe — sem ela não há sessão autenticada de onde tirar um
     `User.id` de verdade);
   - `prisma.match.create({ data: { arenaId, player1Id, player2Id, winnerId, player1Score, player2Score, endedAt } })`
     — grava o histórico da partida;
   - `prisma.user.update({ where: { id: winnerId }, data: { rankingPoints: { increment: 3 } } })`
     — soma ranking do vencedor;
   - `prisma.user.update({ where: { id: loserId }, data: { rankingPoints: { increment: -1 } } })`
     — subtrai ranking do perdedor.

2. **Perfil e amigos** (`users.routes.ts`, rotas REST) — cada rota faz sua
   própria query:

   | Rota | Query Prisma | Observação |
   |---|---|---|
   | `GET /users/:id` | `user.findUnique({ where: { id }, select: PUBLIC_USER_FIELDS })` | 404 se não achar |
   | `PATCH /users/:id` | `user.update({ where: { id }, data: { username?, avatarUrl? } })` | 404 se `id` não existe (P2025); 409 se `username` já em uso (P2002) |
   | `GET /users/:id/friends` | `friendship.findMany({ where: { status: "ACCEPTED", OR: [{ requesterId: id }, { addresseeId: id }] }, include: { requester, addressee } })` | busca nos dois sentidos (peça enviada ou recebida) |
   | `POST /users/:id/friends` | `friendship.findFirst(...)` pra checar duplicata, depois `friendship.create({ data: { requesterId: id, addresseeId: targetUserId, status: "PENDING" } })` | 409 se já existe relação; 404 se `targetUserId` não existe (P2003, FK) |
   | `PATCH /users/:id/friends/:friendshipId` | `friendship.findUnique({ where: { id: friendshipId } })` pra validar dono, depois `friendship.update({ data: { status } })` | só o `addressee` pode aceitar/recusar (`status: ACCEPTED`/`BLOCKED`) |
   | `DELETE /users/:id/friends/:friendshipId` | `friendship.findUnique(...)` pra validar dono, depois `friendship.delete({ where: { id: friendshipId } })` | requester ou addressee podem remover |

3. **Leaderboard** — `GET /leaderboard-data` faz
   `prisma.user.findMany({ orderBy: { rankingPoints: "desc" }, take: 50, select: { id, username, avatarUrl, rankingPoints } })`,
   sem paginação além do `take: 50`.
