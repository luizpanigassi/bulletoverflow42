*Este projeto foi criado como parte do currículo da 42 por luinasci, jcologne, tguilher, lilmende.*

# 🎮 Bullet Overflow

*[Read in English](README.md)*

## Descrição

**Bullet Overflow** é um jogo de tiro multiplayer em arena, visto de cima, em tempo real — a nossa versão do projeto ft_transcendence. Dois jogadores se enfrentam em partidas rápidas de 1v1 (o primeiro a fazer 5 pontos vence), em várias arenas diferentes, com dash, power-ups e skins de personagem pra escolher.

O jogo em si roda no motor **Godot 4.4**, exportado em WebAssembly e embutido diretamente numa aplicação React (SPA). A aplicação web ao redor cuida de tudo que uma plataforma multiplayer moderna precisa: autenticação (email/senha, OAuth via 42, 2FA), matchmaking, amigos e desafios diretos, histórico de partidas, leaderboard, e perfis de jogador com avatar e nome de usuário personalizados — tudo servido por uma infraestrutura containerizada, protegida por WAF e exclusivamente em HTTPS.

Principais funcionalidades:
- Combate 1v1 em tempo real, com reconexão e detecção de desistência por desconexão
- Oponente de IA com três níveis de dificuldade pra treino offline
- Sistema de conta completo: cadastro/login, 2FA por email, login via OAuth 42, avatares customizados
- Sistema de amigos com status online e desafio direto (pula a fila de matchmaking)
- Histórico de partidas, estatísticas de vitória/derrota, conquistas e leaderboard global
- Seleção de personagem (3 skins) tanto no PvP quanto contra a IA

## Instruções

### Pré-requisitos
- Docker + Docker Compose (v1 ou v2 — o Makefile detecta automaticamente qual você tem)
- Um arquivo `docker/.env` (veja `server/.env.example` pras variáveis necessárias — credenciais do banco, `JWT_SECRET`, `FRONTEND_URL`, credenciais do OAuth 42, credenciais de SMTP pro envio do código de 2FA)

### Rodando o projeto
A stack inteira (Postgres, backend, frontend e o proxy reverso WAF/nginx) sobe com um único comando:

```bash
make docker-up
```

Isso builda e inicia todos os containers, aplica as migrations pendentes do Prisma, e serve a aplicação via HTTPS em `https://localhost:8443` (certificado autoassinado — o navegador vai avisar sobre isso, é esperado em ambiente local/teste).

Outros comandos úteis:
```bash
make docker-down      # para tudo
make docker-restart   # down + up
make docker-build     # força rebuild limpo das imagens de backend/frontend
make docker-logs      # acompanha os logs de todos os containers
```

### Desenvolvimento local (sem Docker)
Veja `server.md` (backend) pra rodar o servidor Fastify direto com `npm run dev`, e `frontend/README.md` pro servidor de desenvolvimento do Vite. O client em Godot é exportado pelo editor da Godot (4.4+) pra pasta `build/web/`, que o backend serve na rota `/play/`.

## Recursos

- [Documentação da Godot Engine 4.4](https://docs.godotengine.org/en/4.4/) — motor de jogo, GDScript, export Web
- [Documentação do Fastify](https://fastify.dev/docs/latest/) — framework de backend, plugin de WebSocket, arquivos estáticos
- [Documentação do Prisma](https://www.prisma.io/docs) — ORM e migrations
- [Documentação do React](https://react.dev/) e [React Router](https://reactrouter.com/) — frontend
- [OWASP ModSecurity Core Rule Set](https://coreruleset.org/) — configuração do WAF
- [Documentação da API OAuth da 42](https://api.intra.42.fr/apidoc/guides/getting_started) — integração do login via 42
- [MDN: WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — rede em tempo real do jogo

### Como usamos IA

Usamos ao longo do projeto como assistente de pair-programming e debugging, principalmente no lado do client de jogo (Godot/GDScript) e na integração de infraestrutura. Concretamente, foi usado para:
- Diagnosticar e corrigir bugs de sincronização multiplayer (posição de spawn, animações, munição, escudo, lógica de reconexão)
- Resolver conflitos de merge ao integrar trabalho paralelo de branches diferentes do time (sistema de auth, infra/WAF, features do jogo)
- Debugar problemas de roteamento no Docker/nginx/WAF e de certificado TLS durante o deploy numa VM na nuvem

Todo código feito com IA foi revisado, testado na aplicação rodando, e entendido por quem aplicou antes de ser commitado — as mudanças eram consistentemente revisadas como diff, em vez de aplicadas direto, exatamente pra cada um poder aprender e verificar o que estava entrando no projeto.

## Informações da Equipe

| Integrante | Login | Papel(éis) | Responsabilidades |
|---|---|---|---|
| Luiz | luinasci | Product Owner, Desenvolvedor do Client de Jogo | Definiu escopo e prioridades do produto; construiu o client em Godot (movimento, combate, arenas, IA, seleção de personagem); integrou o export Web da Godot no frontend React; liderou a integração final e correção de bugs entre as branches do time. |
| Lilian | lilmende | Tech Lead / Arquiteta | Dona da arquitetura do frontend (React/Vite) e da integração de matchmaking/WebSocket em tempo real entre o client e o backend. |
| João | jcologne | Project Manager / Scrum Master | Construiu o sistema de autenticação do backend: cadastro/login, sessões JWT, 2FA por email, OAuth 42, sistema de amigos, desafios diretos, upload de avatar, e dados de perfil. |
| Thiago | tguilher | QA / DevOps Lead | Construiu a infraestrutura Docker Compose, o proxy reverso nginx com TLS, e o WAF ModSecurity da OWASP; cuida da configuração de deploy (SMTP, credenciais OAuth). |

*(Os quatro também contribuímos como desenvolvedores em partes diversas do código — ver "Contribuições Individuais" abaixo.)*

## Gestão do Projeto

O trabalho foi organizado por área de responsabilidade (client de jogo, frontend, backend/auth, infra), com cada integrante responsável pela própria camada e alinhando com o resto do time sempre que as features cruzavam essas fronteiras (ex: propagar username do matchmaking pro jogo, ou resolver conflitos de merge entre a branch de infra e a de auth).

- **Organização de tarefas**: board do GitHub Projects
- **Canal de comunicação**: WhatsApp (grupo do time)
- **Revisão de código**: toda pull request exigia revisão e aprovação de pelo menos mais um integrante antes de mergear na `main`

## Stack Técnica

**Frontend**: React 19 + Vite, React Router, Tailwind CSS. Se comunica com o backend via HTTP (fetch) e WebSockets (fila de matchmaking, estado da partida em tempo real).

**Backend**: Node.js + Fastify 5, com `@fastify/websocket` pro gameplay/matchmaking em tempo real e `@fastify/static` pra servir os assets do frontend e o export Web da Godot. Autenticação via JWT (`jsonwebtoken`), hash de senha, envio de 2FA por email via `nodemailer` (SMTP configurável — Brevo no nosso deploy), integração com OAuth 42.

**Client de jogo**: Godot 4.4 (GDScript), exportado em WebAssembly e embutido na aplicação React via uma ponte JS (`window.initGameSession` / `window.onMatchEnded`).

**Banco de dados**: PostgreSQL, acessado através do **Prisma** como ORM. Escolhido pelo client gerado com tipagem segura (pega incompatibilidade de schema/query em tempo de compilação no TypeScript) e pelo fluxo simples de migration, o que importou bastante com quatro pessoas mexendo no schema de forma independente.

**Infraestrutura**: Docker Compose (duas stacks — serviços da aplicação e o proxy), nginx como proxy reverso terminando TLS na frente de um WAF **OWASP ModSecurity Core Rule Set**, certificados autoassinados pra HTTPS local/teste. Orquestrado ponta a ponta com um único `make docker-up`.

## Schema do Banco de Dados

Três tabelas principais (veja `server/prisma/schema.prisma` pra fonte completa):

**`users`** — dados de conta: `id`, `username` (único), `email` (único), `passwordHash` (opcional — nulo pra contas só de OAuth), `avatarUrl`, `fortyTwoId` (único, opcional — preenchido pra contas logadas via 42), `rankingPoints`, `twoFactorCode` / `twoFactorCodeExpiresAt` (2FA), `lastSeenAt` (heartbeat de status online), timestamps.

**`friendships`** — uma linha por relação de amizade: `requesterId` e `addresseeId` (ambos chave estrangeira pra `users`), `status` (`PENDING` / `ACCEPTED` / `BLOCKED`), único no par `(requesterId, addresseeId)`.

**`matches`** — uma linha por partida concluída: `arenaId` (enum), `player1Id` / `player2Id` / `winnerId` (chave estrangeira pra `users`), `player1Score` / `player2Score`, `startedAt` / `endedAt`. Usada pra calcular estatísticas de vitória/derrota, histórico, conquistas e leaderboard.

Relações: um `User` tem várias `friendshipsSent`/`friendshipsReceived` (auto-relacionamento via `Friendship`) e várias `matchesAsPlayer1`/`matchesAsPlayer2`/`matchesWon` (via `Match`).

## Lista de Funcionalidades

| Funcionalidade | Descrição | Autor(es) |
|---|---|---|
| Combate 1v1 em tempo real | Movimento, dash, tiro, escudos, power-ups, obstáculos de arena | Luiz |
| Oponente de IA (3 dificuldades) | Bot com desvio, mira preditiva e busca por powerup | Luiz |
| Seleção de personagem | 3 skins, escolhidas antes de partidas PvP ou vs IA | Luiz |
| Matchmaking (PvP online) | Fila FIFO, relay via WebSocket, reconexão + desistência por desconexão | Luiz, Lilian |
| Cadastro / login | Email+senha com hash/salt, sessões JWT | João |
| 2FA por email | Código de 6 dígitos, expira em 10 minutos | João, Thiago (envio via SMTP) |
| Login via OAuth 42 | Login pela Intra 42 | João, Thiago (credenciais/deploy) |
| Nome de usuário customizado | Usuário escolhe o próprio username no cadastro / primeiro login OAuth | Luiz |
| Upload de avatar | Upload de imagem em base64, servido pelo backend | João |
| Amigos e status online | Adicionar/aceitar amigos, indicador online via heartbeat | João |
| Desafios diretos | Desafiar um amigo direto, pulando a fila de matchmaking | João |
| Histórico e estatísticas | Vitórias/derrotas, pontos de ranking, partidas recentes | João |
| Conquistas | Badges por marco de vitórias (1/5/10/50/100) | Luiz |
| Leaderboard | Ranking global por pontos | João |
| WAF | OWASP ModSecurity CRS na frente de toda a stack | Thiago |
| Deploy containerizado | Orquestração multi-container com um único comando | Thiago |
| Política de Privacidade / Termos de Serviço | Acessível de qualquer página via rodapé | Luiz |

## Módulos

**Total reivindicado: 18 pontos** (14 mínimo + 4 de margem)

| Módulo | Categoria | Tipo | Pontos | Justificativa |
|---|---|---|---|---|
| Framework frontend + backend | Web | Major | 2 | React (frontend) + Fastify (backend), os dois usados como arquitetura central da aplicação, não superficialmente. |
| ORM | Web | Minor | 1 | Prisma + PostgreSQL, com schema relacional (`users`/`friendships`/`matches`) e migrations versionadas. |
| Real-time features (WebSockets) | Web | Major | 2 | Sincronização de posição/hit/powerup em tempo real entre clients, tratamento de desconexão, broadcast eficiente. |
| Gerenciamento padrão de usuário | User Management | Major | 2 | Edição de perfil, upload de avatar com fallback padrão, amigos com status online, página de perfil. |
| OAuth 2.0 | User Management | Minor | 1 | Login via Intra 42 (authorize → callback → criação/atualização de conta). |
| Histórico e estatísticas | User Management | Minor | 1 | Stats, histórico de partidas, leaderboard e conquistas/progressão — os quatro sub-requisitos cobertos. |
| 2FA | User Management | Minor | 1 | Código de 6 dígitos por email, exigido antes de completar o login quando ativado. |
| Jogo web completo | Gaming & UX | Major | 2 | Jogo em Godot 4.4, partidas ao vivo, condição de vitória clara (primeiro a 5). |
| Jogadores remotos | Gaming & UX | Major | 2 | Dois jogadores em máquinas separadas, tempo real, tratamento de reconexão. |
| Oponente de IA | Artificial Intelligence | Major | 2 | Três níveis de dificuldade com comportamento distinto e imperfeito (humano). |

## Contribuições Individuais

**Luiz (luinasci) — Product Owner, Client de Jogo**
Construiu o client em Godot de ponta a ponta: movimento/combate do jogador, arenas, power-ups, o oponente de IA (os três níveis de dificuldade), UX de reconexão/desistência, e seleção de personagem. Integrou o export Web da Godot na aplicação React (a ponte de sessão JS↔Godot). Liderou a integração final: resolvendo conflitos de merge entre as branches de infra e auth, corrigindo bugs que atravessavam camadas (propagação de username, buracos de roteamento no nginx pra avatar/OAuth, persistência de vitória por desistência), e coordenando a última leva de correções (conquistas, fluxo de username customizado, rodapé/páginas legais, seleção de personagem) antes da entrega.
*Desafios enfrentados*: Criar a sincronização de multiplayer com backend, desenhar os eventos do zero, definir o escopo do jogo.

**Lilian (lilmende) — Tech Lead / Arquiteta**
Desenhou e construiu a arquitetura fundamental do frontend: a estrutura do projeto React/Vite, o roteamento, e o sistema de design visual escuro consistente em Tailwind usado em todas as páginas. Construiu a abordagem original de embutir a Godot dentro do React (injeção de script, ciclo de vida do canvas, a ponte de sessão JS↔Godot) e a UI original da fila de matchmaking, sobre as quais o trabalho posterior (seleção de personagem, username customizado, etc.) foi construído. Responsável pela camada de integração em tempo real conectando o client ao protocolo de matchmaking e partida ao vivo via WebSocket do backend.
*Desafios enfrentados*: [PREENCHER COM A LILIAN]

**João (jcologne) — Project Manager / Scrum Master**
Construiu todo o sistema de autenticação e social: cadastro/login com senha em hash, sessões JWT, 2FA por email, integração OAuth 42, amigos (pedido/aceite/status online), desafios diretos, upload de avatar, e endpoints de perfil/histórico de partidas.
*Desafios enfrentados*: [PREENCHER COM O JOÃO]

**Thiago (tguilher) — QA / DevOps Lead**
Construiu a infraestrutura Docker Compose (stacks de app e proxy), o proxy reverso nginx com terminação TLS, e o WAF ModSecurity da OWASP. Cuidou da configuração de deploy na nuvem (SMTP pros emails de 2FA, credenciais OAuth 42, certificados TLS pra VM em produção).
*Desafios enfrentados*: [PREENCHER COM O THIAGO]
