# Server — Bullet Overflow

Substitui os antigos `backend_contract.md`/`backend_architecture.md` (removidos por descreverem um
modelo de autoridade diferente do que foi implementado).

## Stack

- **TypeScript + Node.js + Fastify 5**, com `@fastify/websocket` (protocolo de
  jogo) e `@fastify/static` (serve o build web do client).
- **PostgreSQL + Prisma** para usuários, amigos, histórico de partidas e
  ranking (`server/prisma/schema.prisma`) — auth, amigos, desafios e
  persistência de partida já leem/escrevem no banco de verdade.
- Tick de referência: **60Hz**, igual ao `_physics_process` do client — mas o
  servidor não roda um loop de simulação próprio, é orientado a evento (ver
  Modelo de autoridade).

## Estrutura (`server/src/`)

```
main.ts                          entry point: registra rotas, CORS, sobe o Fastify
env.ts                           variáveis de ambiente centralizadas
database/prisma.ts               instância única do Prisma Client
auth/auth.routes.ts              signup/login, 2FA, OAuth 42
auth/jwt.ts                      assina/valida o JWT de sessão (1 dia)
auth/password.ts                 hash/verificação de senha (scrypt)
auth/two-factor.ts               geração de código 2FA + envio por email (nodemailer)
auth/oauth-fortytwo.ts           troca de code por perfil na API da 42
auth/require-auth.ts             preHandler que valida o JWT nas rotas protegidas
users/users.routes.ts            perfil, avatar, heartbeat, amigos
leaderboard/leaderboard.routes.ts  GET /leaderboard-data (lê do Postgres)
matchmaking/queue.ts             fila FIFO de matchmaking
matchmaking/matchmaking.routes.ts  WS /matchmaking/queue — forma o par e cria a Match
matchmaking/challenges.routes.ts  desafio direto entre amigos (pula a fila)
matches/match-manager.ts         classe Match (estado de uma partida) + MatchManager
matches/persist-match-result.ts  grava o resultado da partida e atualiza ranking
game/powerup-authority.ts        timing + tipo + posição do powerup, loop de spawn
websocket/websocket.plugin.ts    WS /matches/:matchId — conecta e roteia mensagens de gameplay
```

Princípio de separação: `websocket/` só conecta e roteia (o roteamento por
`data.type` mora ali, mas a lógica de cada tipo vive em `game/` ou é só um
`relayToOpponent`); `matches/` guarda o *estado* da partida; `game/` guarda as
*regras* que o servidor de fato arbitra; `matchmaking/` só forma pares e gera
`match_id`.

## Banco de dados (PostgreSQL + Prisma)

O acesso ao banco é inteiramente via **Prisma Client**, instanciado uma única
vez em `database/prisma.ts`:

```ts
export const prisma = new PrismaClient();
```

Uma única instância compartilhada por todo o servidor (não uma por request/
módulo) evita esgotar o pool de conexões do Postgres — especialmente
relevante em dev, onde `tsx watch` reinicia o processo a cada mudança de
arquivo e cada reinício recriaria conexões se o client fosse instanciado em
outro lugar.

### Conexão

- `DATABASE_URL` (`server/.env`, nunca commitado — ver `.env.example`) no
  formato `postgresql://user:password@host:5432/bullet_overflow?schema=public`.
- `env.ts` só lê a variável (`process.env.DATABASE_URL ?? ""`) — não valida
  formato nem testa a conexão no boot; se o Postgres estiver fora do ar, o
  erro só aparece na primeira query real (hoje, isso só acontece em
  `GET /leaderboard`).
- O backend em si só espera uma URL válida — não sobe nem gerencia o ciclo de
  vida do banco (isso fica a cargo da infra, ex: Docker Compose com volume
  dedicado pro Postgres em ambiente real).

### Schema (`server/prisma/schema.prisma`)

| Model | Campos principais | Papel |
|---|---|---|
| `User` | `id`, `username`, `email` (únicos), `passwordHash` (nulo se só login via 42), `avatarUrl`, `fortyTwoId` (único, nulo se nunca logou via OAuth), `rankingPoints` (default 0), `twoFactorEnabled`, `lastSeenAt` | Conta do jogador — cobre tanto login local (email+senha) quanto OAuth 42, no mesmo model. |
| `Friendship` | `requesterId`, `addresseeId`, `status` (`PENDING`/`ACCEPTED`/`BLOCKED`), único por par | Relação de amizade entre dois `User`. |
| `Match` | `arenaId` (enum `arena_01`/`arena_02`/`arena_03`), `player1Id`/`player2Id`/`winnerId`, `player1Score`/`player2Score`, `startedAt`/`endedAt` | Histórico de partida — grava ao fim de cada partida real (`persist-match-result.ts`). |

Comandos (`server/package.json`):

```
npm run prisma:generate   # gera o Prisma Client a partir do schema
npm run prisma:migrate    # aplica/gera migration em dev (prisma migrate dev)
npm run prisma:studio     # abre o Prisma Studio (GUI pra inspecionar dados)
```

`prisma:generate` precisa rodar sempre que `schema.prisma` mudar (e depois de
um `npm install` limpo, já que o client gerado fica em `node_modules/.prisma`,
fora do controle de versão). Isso baixa binários de `binaries.prisma.sh` — em
redes restritas isso pode falhar silenciosamente; testar localmente antes de
assumir que o client está gerado.

### O que já usa o banco de verdade hoje

Praticamente tudo: `auth` (signup/login/2FA/OAuth), `users` (perfil, avatar,
amigos), `leaderboard-data` (top 50) e o fim de cada partida real
(`persist-match-result.ts`, ver acima). O único ponto que ainda aceita dado
não autenticado é o matchmaking sem token (ver "Como isso se conecta ao
gameplay" abaixo).

## Autenticação e Autorização

Auth real implementada — ver `AUTH.md` pro detalhamento completo de rotas,
hashing e proteção de rota. Resumo:

### Requisito do subject (`subject.txt`)

- Baseline obrigatório: signup/login com email+senha, senha **hasheada e
  salteada** — implementado via `scrypt` + salt (`auth/password.ts`).
- Módulo opcional adotado: **OAuth 2.0 via 42** — implementado
  (`GET /auth/42` + `/auth/42/callback`, `auth/oauth-fortytwo.ts`).
- Requisito técnico geral do subject: backend deve servir tudo via **HTTPS**
  — em dev local isso não é feito (HTTP puro em `127.0.0.1`), quem termina
  TLS é o proxy reverso Nginx/WAF (`docker/nginx/`), tanto local
  (certificado autoassinado) quanto na VM (Let's Encrypt).

### Login local (email + senha)

1. `POST /auth/signup` — recebe `email`/`username`/`password`, gera o hash
   via `scrypt` (`auth/password.ts`) e grava em `User.passwordHash`.
2. `POST /auth/login` — verifica o hash; se a conta tiver `twoFactorEnabled`,
   dispara o fluxo de código por email antes de emitir o JWT (ver
   `TWO_FACTOR_AUTH.md`); senão emite o JWT direto (`signSession`,
   `JWT_SECRET`, validade de 1 dia).
3. Rotas protegidas usam o preHandler `requireAuth` (`auth/require-auth.ts`),
   que valida o JWT via header `Authorization: Bearer` antes de deixar a
   rota executar.

### OAuth 42

1. `GET /auth/42` — redireciona pro endpoint de autorização da API da 42,
   usando `FORTYTWO_CLIENT_ID` + `FORTYTWO_CALLBACK_URL`.
2. `GET /auth/42/callback` — recebe o `code`, troca por um access token
   (`FORTYTWO_CLIENT_SECRET`), busca o perfil do usuário na API da 42, e faz
   um `upsert` de `User` por `fortyTwoId` (criando a conta na primeira vez,
   sem exigir senha — por isso `passwordHash` é nulável no schema), e
   redireciona pro frontend com o token e os dados da sessão na URL.
3. Emite o mesmo tipo de JWT de sessão que o login local, pra unificar o
   restante do backend (rotas protegidas não precisam saber se o login foi
   local ou via 42).

### Como isso se conecta ao gameplay (matchmaking/partida)

`/matchmaking/queue` aceita um `token` opcional além do `userId`/`characterId`
de antes: **com token válido**, o servidor resolve o `userId` real da sessão
via `verifySession` e ignora qualquer `userId` que o client tenha mandado;
**sem token**, mantém o fluxo antigo (`userId` livre ou `guest-<uuid>` — login
não é obrigatório pra jogar). Isso é o que faz o resultado da partida gravar
no `User` de verdade em vez de sempre criar um guest — ver
`persist-match-result.ts` acima e `AUTH.md`.

## Modelo de autoridade

| Aspecto | Autoridade | Como |
|---|---|---|
| Posição / movimento | **Client** | Servidor aceita `position_x`/`position_y` de cada `player_input` e repassa como `player_state` **só pro oponente** (nunca ecoa de volta — ver nota abaixo). Sem resimulação; valida deslocamento máximo desde a última posição aceita (anti-teleporte grosseiro, ver nota abaixo). |
| Disparo / projétil | **Client** | Client cria o projétil localmente e manda `projectile_spawn`; servidor só repassa pro oponente. |
| Colisão / hit | **Client detecta, servidor decide o resultado** | Client manda `player_hit` quando seu projétil colide; servidor aceita sem validar (sem anti-cheat, decisão do time) e é quem emite `player_died` + `round_end` (+ `match_end` se for o 5º ponto) pros dois. |
| Placar de round | **Servidor** | Contado a partir de cada `player_hit` aceito (`Match.registerRoundEnd`), não confiado ao client. |
| Powerup — timing/tipo/posição | **Servidor** | Sorteia intervalo (1-10s), tipo (uniforme entre os 3) e posição (entre os spawn points da arena sorteada pro match — `arena_01`/`02`/`03`) — ver `game/powerup-authority.ts`. |
| Powerup — coleta | **Servidor** | Arbitra corrida: primeiro `powerup_collect_request` pro `powerup_id` ainda ativo vence; demais são ignorados. |
| Início do 1º round | **Servidor** | Emite `match_start` + `round_start` assim que os dois sockets da match conectam. Rounds seguintes são disparados localmente por cada client (`reset_round()`), sem novo `round_start` do servidor. |
| Fim de partida (placar = 5) | **Servidor** | Calculado a partir do placar interno da `Match`, emitido junto do `round_end` que fecha o 5º ponto. |
| OAuth, matchmaking, ranking, histórico | **Servidor** | Fora do loop de gameplay. |

**Resumo mental:** o servidor é essencialmente **relay + árbitro de hit/powerup/fim-de-partida**, não um simulador de física — ele nunca resimula posição, só aceita o que o client relata e repassa/decide em cima disso.

### Por que o servidor não ecoa `player_state` de volta pra quem mandou

O client tem um sistema de reconciliação (`Player.reconcile()`) que faz sentido
quando o servidor *resimula* e pode divergir da predição local: ele reaplica
(*replay*) os inputs em buffer sempre que recebe `player_state` do próprio
slot. Como aqui o servidor nunca diverge (ele só devolveria a posição que o
próprio client acabou de mandar), ecoar de volta faria o replay reaplicar
movimento que já tinha sido processado — dobrando-o a cada frame. Por isso
`player_input` é só repassado (`relayToOpponent`), nunca broadcast.

### Anti-teleporte

`Match.lastKnownPosition` guarda a última posição aceita de cada slot. A
cada `player_input`, o servidor calcula a distância desde essa posição e
rejeita (não repassa, não atualiza a baseline) se ultrapassar 850×2 px/s
(2x o dash, o movimento mais rápido do jogo) escalado pelo tempo real
decorrido desde o último update aceito. Escalar pelo tempo faz saltos
legítimos (respawn após a pausa entre rounds) passarem sem precisar de
lógica extra pra resetar o estado a cada round.

## HTTP

| Rota | Descrição |
|---|---|
| `GET /` | Health check simples (`{status: "ok"}`). |
| `GET /auth/health`, `GET /users/health` | Health check dos módulos. |
| `POST /auth/signup`, `POST /auth/login`, `POST /auth/login/verify-2fa`, `GET /auth/42`, `GET /auth/42/callback` | Ver `AUTH.md`. |
| `GET /users/:id`, `PATCH /users/:id`, `POST /users/:id/avatar`, `POST /users/:id/heartbeat` | Perfil, edição, avatar, status online. |
| `GET /users/:id/friends`, `GET /users/:id/friends/pending`, `POST/PATCH/DELETE /users/:id/friends[/:friendshipId]` | Sistema de amigos. |
| `GET/POST/PATCH/DELETE` em `matchmaking/challenges.routes.ts` | Desafio direto a um amigo (pula a fila). |
| `GET /leaderboard-data` | Top 50 por `rankingPoints`, direto do Postgres via Prisma. |
| `GET /avatars/*` | Serve os avatares enviados por upload. |
| `GET /play/*` | Serve o build web do client (`build/web/`). Aplica headers `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` (exigidos pelo export Web do Godot 4.4). |

## WebSocket — Matchmaking (`GET /matchmaking/queue`)

Query params: `?userId=<string>&characterId=<string>` (ambos opcionais — sem
`userId`, o servidor gera um `guest-<uuid>`; auth de verdade ainda não valida
isso).

1. Client conecta e fica pendurado nessa conexão.
2. Assim que dois jogadores estão na fila, o servidor:
   - Forma o par (FIFO — não é skill-based, é só quem chegou primeiro).
   - Cria uma `Match` de verdade (`match_id` gerado, arena fixa `arena_01`).
   - Começa o loop de powerup dessa match (`startPowerupLoop`).
   - Manda pra **cada um** dos dois uma mensagem `match_found`:

```jsonc
{
  "type": "match_found",
  "match_id": "match_<uuid>",
  "slot": 1,               // ou 2, um pra cada jogador do par
  "arena_id": "arena_01",
  "websocket_url": "ws://127.0.0.1:3000/matches/match_<uuid>?slot=1"
}
```

3. O client então conecta em `websocket_url` pra jogar (isso fecha sozinho a
   conexão da fila, já que `NetworkClient.connect_to_server()` fecha o socket
   anterior antes de abrir o novo — o servidor **não fecha** a conexão da fila
   ativamente logo após o `send()`, pra evitar o client perder a mensagem se o
   frame de close for processado no mesmo poll que o de dados).

Não há fila "por skill" nem cancelamento de fila (desconectar remove da fila
via `socket.on("close")`, mas não há endpoint explícito de "sair da fila").

## WebSocket — Partida (`GET /matches/:matchId?slot=1|2`)

Se `matchId` não existir ou `slot` não for `"1"`/`"2"`, a conexão é fechada
com código `1008`. Ao conectar com sucesso, o servidor registra o socket no
slot correspondente da `Match` e, **assim que os dois slots estiverem
preenchidos pela primeira vez**, dispara:

```jsonc
{"type": "match_start", "match_id": "match_<uuid>"}
{"type": "round_start"}
```

Isso é o único `round_start` que vem do servidor — dispara o spawn dos dois
jogadores no client (`game_manager.gd::start_round()`). Rounds seguintes são
reiniciados localmente por cada client, sem round-trip com o servidor.

### Mensagens que o servidor interpreta por conteúdo

| `type` recebido | Quem manda | O que o servidor faz |
|---|---|---|
| `player_input` | Client, a cada frame com input local | Repassa **só pro oponente** como `player_state` (ver seção de autoridade acima). |
| `player_hit` | Client, quando seu projétil colide com o oponente | Debounce de 1s (evita contar duas vezes o mesmo hit — ver nota abaixo). Se aceito: `broadcast` de `player_died`, libera o powerup ativo (se houver), incrementa o placar interno e `broadcast` de `round_end`; se o placar chegou a 5, também `broadcast` de `match_end`. |
| `powerup_collect_request` | Client, quando o jogador colide com o powerup na tela dele | Só aceita se `powerup_id` bater com o powerup ativo da match (corrida: primeiro vence). Se aceito: `broadcast` de `powerup_collected` + `powerup_removed`, e libera o loop pra spawnar o próximo. |

Qualquer outro `type` (ex: `projectile_spawn`, `player_wrapped`) é só
repassado pro oponente via `relayToOpponent`, sem o servidor entender o
conteúdo.

### Por que existe debounce em `player_hit`

Desde que o client passou a criar uma cópia local do projétil pra si **e**
sincronizar uma cópia pro oponente (via `projectile_spawn`), os dois lados têm
sua própria instância do mesmo tiro — e os dois podem detectar a colisão de
forma independente e mandar `player_hit` quase ao mesmo tempo. Uma janela de
1s ignora o segundo aviso; um round legítimo seguinte só acontece segundos
depois (tela de resultado + contagem regressiva no client), então essa folga
não bloqueia hits reais.

## Powerups (`game/powerup-authority.ts`)

- Ciclo por match: a cada intervalo aleatório entre 1-10s (igual ao valor que
  o client mockado sempre usou), se não houver powerup ativo, sorteia tipo
  (`RAPID_FIRE=0`, `SPEED_BOOST=1`, `SHIELD=2`) e posição (entre uma lista
  fixa de coordenadas — espelham os `Marker2D` do grupo `powerup_spawns` em
  `client/scenes/arenas/arena_ruins.tscn`, única arena do protótipo hoje) e
  faz `broadcast` de `powerup_spawn`.
- Só 1 powerup ativo por vez por match.
- Coleta resolvida por corrida (ver tabela acima).
- **O powerup ativo é liberado em duas situações**: coleta bem-sucedida, ou o
  round terminar (`player_hit` aceito) sem ninguém coletar — o client sempre
  limpa o powerup da tela em `end_round()`, mas só avisa o servidor quando é
  de fato coletado; sem liberar também no `round_end`, o loop travava pra
  sempre depois do primeiro powerup não coletado.
- O loop para de tentar spawnar (mas continua "vivo", só não faz nada) se
  qualquer um dos dois slots desconectar.

## Fluxo completo de uma partida

1. Dois clients conectam em `/matchmaking/queue` (cada um com seu `userId`).
2. Servidor forma o par, cria a `Match`, cada client recebe `match_found` com
   seu `slot` + `websocket_url`.
3. Cada client conecta em `/matches/:matchId?slot=N`.
4. Assim que os dois estão conectados: `match_start` + `round_start` →
   client spawna os dois jogadores.
5. Durante o round: `player_input` (posição/mira) flui a cada frame,
   `projectile_spawn` quando alguém atira, `powerup_spawn`/`powerup_collect_request`/
   `powerup_collected`/`powerup_removed` conforme o ciclo de powerup.
6. Alguém toma um hit → client manda `player_hit` → servidor emite
   `player_died` + `round_end` (placar interno incrementado).
7. Se placar < 5: cada client reinicia o próprio round localmente
   (`reset_round()`), sem novo aviso do servidor.
8. Se placar chegou a 5: servidor também emite `match_end` com o placar final
   e o slot vencedor.

## O que ainda não implementado / limitações conhecidas

- **Anti-cheat de `player_hit`** — aceito sem checar alcance/cooldown/linha de
  visão (decisão consciente do time, documentada na tabela de autoridade).
- **Matchmaking sem token** — jogar sem estar logado ainda é permitido
  (`userId` livre ou `guest-<uuid>`); só quem manda `token` tem o resultado
  gravado no `User` de verdade.
- **Fila de matchmaking sem cancelamento explícito** — só sai da fila ao
  desconectar o socket.
- **Rotas de leitura pública** — `GET /users/:id`, `GET /users/:id/friends`,
  `GET /users/:id/friends/pending` e `POST /users/:id/friends` (enviar
  pedido) não exigem token (ver `AUTH.md`).
- **Reconexão sem suporte no servidor** — o client já tem toda a lógica pra
  reconectar (tela de "oponente desconectado", contagem de 60s, botão de W.O.,
  `request_state_sync`/`state_sync` pra sincronizar placar e posição), mas o
  servidor nunca manda `request_state_sync` (o client fica sem receber esse
  catch-up ao reconectar) e o "reivindicar vitória por W.O." só emite um
  evento local no client — nunca chega a virar mensagem de rede, então o
  servidor nunca fica sabendo que a partida acabou por W.O.

## Como rodar / testar

Ver `Makefile` na raiz do projeto:

- `make setup` — instala o que faltar (Godot, export templates, Chrome,
  `export_presets.cfg`, build web, deps do server) numa máquina nova.
- `make server` — sobe o backend em foreground (`npm run dev`).
- `make server-bg` / `make stop` — sobe em background / derruba.
- `make play` — garante o server rodando e abre duas janelas do Chrome
  (perfis isolados), uma por jogador, apontando pro build web servido em
  `/play/`.
- `make smoke-test-1` / `make smoke-test-2` — abre o client Godot nativo
  conectando direto numa match fixa (`smoke_test`, criada no boot do
  servidor), sem passar pela fila — útil pra isolar problema de relay puro
  de problema de matchmaking.
