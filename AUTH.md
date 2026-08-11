# Autenticação — como funciona

Documento focado especificamente em como o `server/` autentica usuários e
como isso se conecta ao resto do backend (perfil, matchmaking). Para o resto
do funcionamento do server, ver `server.md`; para a conexão com o banco, ver
`DATABASE.md`.

## Hash de senha (`server/src/auth/password.ts`)

Usa `crypto.scrypt`, nativo do Node — nenhuma dependência nova só pra isso
(evita repetir os problemas de binário nativo que já tivemos com Prisma em
Alpine/Docker).

- `hashPassword(password)` — gera um salt aleatório de 16 bytes, deriva uma
  chave de 64 bytes via scrypt, retorna `"<salt_hex>:<hash_hex>"`.
- `verifyPassword(password, stored)` — separa salt/hash do valor salvo,
  deriva de novo com o mesmo salt, compara com `timingSafeEqual` (evita
  timing attack no lugar de um `===` direto).

O resultado é salvo em `User.passwordHash` (nulável — fica `null` pra
contas que só logam via OAuth 42, quando esse fluxo existir).

## Sessão via JWT (`server/src/auth/jwt.ts`)

- `signSession(userId)` — assina `{ sub: userId }` com `JWT_SECRET`
  (`server/.env`), validade de 7 dias.
- `verifySession(token)` — valida o token; retorna `{ userId }` ou `null`
  se inválido/expirado.

Não há refresh token nem revogação — expira e pronto, precisa logar de novo.

## Rotas (`server/src/auth/auth.routes.ts`)

| Rota | O quê |
|---|---|
| `GET /auth/health` | health check |
| `POST /auth/signup` | valida `username`/`email`/`password` (mín. 8 caracteres), hasheia a senha, cria o `User`, retorna `{ token, user }` |
| `POST /auth/login` | busca `User` por `email`, verifica hash, retorna `{ token, user }` no mesmo formato do signup |

`user` no retorno nunca inclui `passwordHash` — só campos públicos (`id`,
`username`, `email`, `avatarUrl`, `rankingPoints`, `createdAt`).

Erros: `400` campos faltando/senha curta, `409` email/username já
cadastrado (`P2002` do Prisma), `401` credenciais inválidas no login.

## Protegendo rotas (`server/src/auth/require-auth.ts`)

Um `preHandler` do Fastify:

```ts
export async function requireAuth(request, reply) {
  const token = request.headers.authorization?.startsWith("Bearer ")
    ? authHeader.slice(7) : undefined;
  const session = token ? verifySession(token) : null;
  if (!session) { reply.code(401).send({ error: "..." }); return; }
  request.userId = session.userId; // via getAuthUserId(request)
}
```

Hoje só está aplicado em `PATCH /users/:id`
(`{ preHandler: requireAuth }`), com checagem de dono:

```ts
if (getAuthUserId(request) !== id) {
  reply.code(403);
  return { error: "Não é possível editar o perfil de outro usuário" };
}
```

Resto das rotas de `users.routes.ts` (`GET /users/:id`, friends) continua
público — não exigem token ainda.

## Matchmaking (`server/src/matchmaking/matchmaking.routes.ts`)

A fila (`GET /matchmaking/queue`, WebSocket) aceita um novo query param
`token`, além do `userId`/`characterId` de antes:

- **Com `token`**: valida via `verifySession`. Se válido, usa o `userId` da
  sessão como identidade do jogador — **ignora** qualquer `userId` que o
  client tenha mandado. Se o token for inválido, fecha a conexão
  (`1008`).
- **Sem `token`**: mantém o fluxo antigo — usa o `userId` (username) que o
  client mandar, ou gera `guest-<uuid>`. Login não é obrigatório pra jogar.

Isso faz o resultado da partida (`persistMatchResult`, ver `DATABASE.md`)
gravar no `User` de verdade em vez de criar um guest a cada partida.

### O bug que existia até essa integração

O `userId` resolvido no matchmaking nunca chegava na partida em si.
`websocket.plugin.ts` (`GET /matches/:matchId`) sempre sobrescrevia com um
placeholder fixo (`smoke-test-slot-${slot}`) — resquício do smoke test
manual do início do projeto, antes do matchmaking existir. Ou seja, mesmo
autenticado, o resultado da partida sempre acabava gravado num usuário
fantasma.

**Fix**: `Match` (`match-manager.ts`) ganhou `expectedUserIds`, um mapa
`slot -> userId` preenchido pelo matchmaking na hora de criar a partida
(`match.setExpectedUserId(1, p1.userId)` etc). `websocket.plugin.ts` agora
lê esse valor ao conectar (`match.expectedUserIds[playerSlot]`), e só cai
no placeholder antigo se a partida não veio do matchmaking — preserva o
smoke test manual (`client/scenes/debug/network_smoke_test.tscn`), que
continua funcionando do jeito que sempre funcionou.

## Frontend

- `LoginPage.tsx` — chama `POST /auth/signup`/`POST /auth/login` de
  verdade (antes só simulava, gravando `username`/`email` direto no
  `localStorage`). Guarda `bullet_token`, `bullet_user_id`,
  `bullet_username`, `bullet_email`.
- `MatchmakingPage.tsx` — manda `?token=` na fila quando há sessão
  (`bullet_token` no `localStorage`); sem sessão, cai no `?userId=` de
  antes.
- `ProfilePage.tsx` — prefere `bullet_user_id` (real) pra buscar o
  perfil; cai pro username em sessões antigas/guest.

## O que ainda falta

- **OAuth 42** (`GET /auth/42` + callback) — não implementado. Requisito
  obrigatório do subject é só email+senha, então isso é opcional.
- **2FA por email** — implementado (checkbox no login, código numérico
  enviado por email via nodemailer). Ver `TWO_FACTOR_AUTH.md`.
- Rotas de amigos (`GET/POST/PATCH/DELETE /users/:id/friends`) e
  `GET /users/:id` continuam **sem** exigir token — qualquer um pode ler
  perfil/amigos de qualquer `id`.
- Sem refresh token — expira em 7 dias e força novo login, sem aviso
  prévio no frontend.
- Frontend não tem UI pra adicionar amigo (a rota existe, só falta a tela).
