# Server — Bullet Overflow

Substitui os antigos `backend_contract.md`/`backend_architecture.md` (removidos por descreverem um
modelo de autoridade diferente do que foi implementado).

## Stack

- **TypeScript + Node.js + Fastify 5**, com `@fastify/websocket` (protocolo de
  jogo) e `@fastify/static` (serve o build web do client).
- **PostgreSQL + Prisma** para usuários, amigos, histórico de partidas e
  ranking (`server/prisma/schema.prisma`) — auth e persistência ainda são
  stub, só a leaderboard já lê do banco de verdade.
- Tick de referência: **60Hz**, igual ao `_physics_process` do client — mas o
  servidor não roda um loop de simulação próprio, é orientado a evento (ver
  Modelo de autoridade).

## Estrutura (`server/src/`)

```
main.ts                          entry point: registra rotas, sobe o Fastify
env.ts                           variáveis de ambiente centralizadas
database/prisma.ts               instância única do Prisma Client
auth/auth.routes.ts              OAuth 42, login/senha (stub)
users/users.routes.ts            perfil, amigos (stub)
leaderboard/leaderboard.routes.ts  GET /leaderboard (funcional, lê do Postgres)
matchmaking/queue.ts             fila FIFO de matchmaking
matchmaking/matchmaking.routes.ts  WS /matchmaking/queue — forma o par e cria a Match
matches/match-manager.ts         classe Match (estado de uma partida) + MatchManager
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
| `User` | `id`, `username`, `email` (únicos), `passwordHash` (nulo se só login via 42), `avatarUrl`, `fortyTwoId` (único, nulo se nunca logou via OAuth), `rankingPoints` (default 0) | Conta do jogador — cobre tanto login local (email+senha) quanto OAuth 42, no mesmo model. |
| `Friendship` | `requesterId`, `addresseeId`, `status` (`PENDING`/`ACCEPTED`/`BLOCKED`), único por par | Relação de amizade entre dois `User`. |
| `Match` | `arenaId` (enum `arena_01`/`arena_02`/`arena_03`), `player1Id`/`player2Id`/`winnerId`, `player1Score`/`player2Score`, `startedAt`/`endedAt` | Histórico de partida — **schema já existe, mas nada grava aqui ainda** (ver "O que ainda é stub"). |

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

Só `GET /leaderboard` (`leaderboard.routes.ts`) — busca os top 50 `User` por
`rankingPoints` via `prisma.user.findMany(...)`. Todo o resto (`auth`,
`users`, e o fluxo de partida/matchmaking) ainda não lê nem escreve no
Postgres — ver seção de Autenticação e "O que ainda é stub" abaixo.

## Autenticação e Autorização

Hoje **não existe autenticação real** — `auth.routes.ts` e `users.routes.ts`
só expõem health checks (`GET /auth/health`, `GET /users/health`), e todo o
resto do backend (matchmaking, partida) aceita qualquer `userId` que o client
mandar, sem validar nada. Esta seção documenta o **design pretendido** e o
que já existe em `env.ts` pra suportá-lo.

### Requisito do subject (`subject.txt`)

- Baseline obrigatório: signup/login com email+senha, senha **hasheada e
  salteada** (`subject.txt` linhas 239-242).
- Módulo opcional que o time decidiu adotar: **OAuth 2.0 via 42** (login
  remoto).
- Requisito técnico geral do subject: backend deve servir tudo via **HTTPS**
  — em dev local isso não é feito (HTTP puro em `127.0.0.1`), fica a cargo do
  reverse proxy (Nginx) em ambiente real.

### Variáveis já reservadas em `env.ts` / `.env.example`

```ts
jwtSecret: process.env.JWT_SECRET ?? "change-me",
fortyTwo: {
  clientId: process.env.FORTYTWO_CLIENT_ID ?? "",
  clientSecret: process.env.FORTYTWO_CLIENT_SECRET ?? "",
  callbackUrl: process.env.FORTYTWO_CALLBACK_URL ?? "",
},
```

Ou seja: a infraestrutura de configuração pra JWT e OAuth 42 já existe, só a
lógica que consome essas variáveis ainda não foi escrita.

### Fluxo de login local (email + senha) — planejado, não implementado

1. `POST /auth/signup` — recebe `email`/`username`/`password`, gera o hash
   (candidatos: `argon2` ou `bcrypt` — nenhum ainda é dependência do
   projeto) e grava em `User.passwordHash`.
2. `POST /auth/login` — verifica o hash, e se bater, emite um JWT assinado
   com `JWT_SECRET`.
3. Rotas protegidas usariam um `preHandler` do Fastify que valida esse JWT
   (via cookie httpOnly ou header `Authorization: Bearer`) antes de deixar a
   rota executar.

### Fluxo OAuth 42 — planejado, não implementado

1. `GET /auth/42` — redireciona pro endpoint de autorização da API da 42,
   usando `FORTYTWO_CLIENT_ID` + `FORTYTWO_CALLBACK_URL`.
2. `GET /auth/42/callback` — recebe o `code`, troca por um access token
   (`FORTYTWO_CLIENT_SECRET`), busca o perfil do usuário na API da 42, e faz
   um `upsert` de `User` por `fortyTwoId` (criando a conta na primeira vez,
   sem exigir senha — por isso `passwordHash` é nulável no schema).
3. Emite o mesmo tipo de JWT de sessão que o login local, pra unificar o
   restante do backend (rotas protegidas não precisam saber se o login foi
   local ou via 42).

### Como isso se conecta ao gameplay (matchmaking/partida)

Hoje o `userId` usado em `/matchmaking/queue?userId=...` é **só uma string
que o client decide** (ou um `guest-<uuid>` se não mandar nada) — não passa
por nenhuma verificação de sessão. Quando a autenticação acima existir, o
caminho natural é: o client manda o JWT de sessão (query param ou header no
upgrade do WebSocket), e o servidor valida esse token *antes* de enfileirar o
jogador, usando o `id` do `User` autenticado como `userId` real (em vez de
confiar no que o client afirma).

## Modelo de autoridade

| Aspecto | Autoridade | Como |
|---|---|---|
| Posição / movimento | **Client** | Servidor aceita `position_x`/`position_y` direto de cada `player_input` e repassa como `player_state` **só pro oponente** (nunca ecoa de volta pra quem mandou — ver nota abaixo). Sem resimulação, sem validação de distância ainda (TODO). |
| Disparo / projétil | **Client** | Client cria o projétil localmente e manda `projectile_spawn`; servidor só repassa pro oponente. |
| Colisão / hit | **Client detecta, servidor decide o resultado** | Client manda `player_hit` quando seu projétil colide; servidor aceita sem validar (sem anti-cheat, decisão do time) e é quem emite `player_died` + `round_end` (+ `match_end` se for o 5º ponto) pros dois. |
| Placar de round | **Servidor** | Contado a partir de cada `player_hit` aceito (`Match.registerRoundEnd`), não confiado ao client. |
| Powerup — timing/tipo/posição | **Servidor** | Sorteia intervalo (1-10s), tipo (uniforme entre os 3) e posição (entre os spawn points conhecidos de `arena_ruins`) — ver `game/powerup-authority.ts`. |
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

## HTTP

| Rota | Descrição |
|---|---|
| `GET /` | Health check simples (`{status: "ok"}`). |
| `GET /auth/health`, `GET /users/health` | Health check dos módulos stub. |
| `GET /leaderboard` | Top 50 por `rankingPoints`, direto do Postgres via Prisma. |
| `GET /play/*` | Serve o build web do client (`build/web/`) — protótipo, só pra testar 2 abas em localhost sem depender de páginas reais. Aplica headers `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` (exigidos pelo export Web do Godot 4.4). |

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

## O que ainda é stub / não implementado

- **Auth real** — `POST`/`GET` de login, OAuth 42, hash de senha, sessão/JWT
  (ver seção "Autenticação e Autorização" acima pro design pretendido). Hoje
  `userId` do matchmaking é só o que o client mandar (ou um guest gerado),
  sem validação nenhuma.
- **Anti-teleporte** — servidor aceita `position_x`/`position_y` de
  `player_input` sem validar deslocamento máximo por tick.
- **Anti-cheat de `player_hit`** — aceito sem checar alcance/cooldown/linha de
  visão (decisão consciente do time, documentada na tabela de autoridade).
- **Persistência de partida** — `prisma/schema.prisma` já tem o modelo
  `Match` (arena, placar, vencedor), mas nada grava lá ainda ao terminar uma
  partida real.
- **Múltiplas arenas** — só `arena_01`/`arena_ruins` está com spawn points
  mapeados no servidor (matchmaking e powerups); `arena_02`/`arena_03`
  existem no client mas o servidor não tem as coordenadas delas.
- **Fila de matchmaking sem cancelamento explícito** — só sai da fila ao
  desconectar o socket.

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
