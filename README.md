*This project has been created as part of the 42 curriculum by luinasci, jcologne, tguilher, lilmende.*

# 🎮 Bullet Overflow

*[Leia em português](README_pt-br.md)*

## Description

**Bullet Overflow** is a real-time top-down multiplayer arena shooter, built as our team's take on the ft_transcendence project. Two players face off in short, fast-paced 1v1 matches (first to 5 points wins) across multiple arenas, with dashes, power-ups, and character skins to choose from.

The game itself runs on the **Godot 4.4** engine, exported to WebAssembly and embedded directly inside a React single-page application. The web app around it handles everything a modern multiplayer platform needs: authentication (email/password, OAuth via 42, 2FA), matchmaking, friends and direct challenges, match history, a leaderboard, and player profiles with custom avatars and usernames — all served through a hardened, containerized, HTTPS-only infrastructure.

Key features:
- Real-time 1v1 combat with reconnect handling and forfeit-by-disconnect detection
- An AI opponent with three difficulty tiers for offline training
- Full account system: signup/login, 2FA by email, OAuth 42 login, custom avatars
- Friends system with online status and direct "challenge a friend" matches (skips the queue)
- Match history, win/loss stats, achievements, and a global leaderboard
- Character selection (3 skins) for both PvP and vs-AI matches

## Instructions

### Prerequisites
- Docker + Docker Compose (v1 or v2, the Makefile auto-detects which one you have)
- A `docker/.env` file (see `server/.env.example` for the variables it needs — database credentials, `JWT_SECRET`, `FRONTEND_URL`, OAuth 42 credentials, SMTP credentials for 2FA emails)

### Running the project
The entire stack (Postgres, backend, frontend, and the WAF/nginx reverse proxy) is orchestrated with a single command:

```bash
make docker-up
```

This builds and starts every container, applies pending Prisma migrations, and serves the app over HTTPS at `https://localhost:8443` (self-signed certificate — your browser will warn about it, that's expected for local/test deployments).

Other useful targets:
```bash
make docker-down      # stop everything
make docker-restart   # down + up
make docker-build     # force a clean rebuild of backend/frontend images
make docker-logs      # tail logs from all containers
```

### Local development (without Docker)
See `server.md` (backend) for running the Fastify server directly with `npm run dev`, and `frontend/README.md` for the Vite dev server. The Godot client itself is exported via the Godot editor (4.4+) into `build/web/`, which the backend serves at `/play/`.

## Resources

- [Godot Engine 4.4 documentation](https://docs.godotengine.org/en/4.4/) — game engine, GDScript, Web export
- [Fastify documentation](https://fastify.dev/docs/latest/) — backend framework, WebSocket plugin, static file serving
- [Prisma documentation](https://www.prisma.io/docs) — ORM and migrations
- [React documentation](https://react.dev/) and [React Router](https://reactrouter.com/) — frontend
- [OWASP ModSecurity Core Rule Set](https://coreruleset.org/) — WAF configuration
- [42 API OAuth documentation](https://api.intra.42.fr/apidoc/guides/getting_started) — OAuth 42 login integration
- [MDN: WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — real-time gameplay networking

### How we used AI

We used it throughout the project as a pair-programming and debugging assistant, primarily on the game-client (Godot/GDScript) and infrastructure-integration side. Concretely, it was used for:
- Diagnosing and fixing multiplayer sync bugs (spawn positions, animations, ammo, shield, reconnect logic)
- Resolving merge conflicts when integrating parallel work from different team members' branches (auth system, infra/WAF, game features)
- Debugging Docker/nginx/WAF routing issues and TLS certificate problems during deployment to a cloud VM

All AI-assisted code was reviewed, tested against the running application, and understood by the person applying it before being committed — changes were consistently reviewed as diffs rather than applied blindly, specifically so each of us could learn from and verify the code going into the project.

## Team Information

| Member | Login | Role(s) | Responsibilities |
|---|---|---|---|
| Luiz | luinasci | Product Owner, Game Client Developer | Defined product scope and priorities; built the Godot game client (movement, combat, arenas, AI opponent, character selection UI); integrated the Godot WebAssembly export into the React frontend; coordinated final integration and bug-fixing across the team's branches. |
| Lilian | lilmende | Tech Lead / Architect | Owns frontend architecture (React/Vite) and the real-time matchmaking/WebSocket integration between the client and backend. |
| João | jcologne | Project Manager / Scrum Master | Built the backend auth system: signup/login, JWT sessions, 2FA by email, OAuth 42, friends system, direct challenges, avatar upload, and profile data. |
| Thiago | tguilher | QA / DevOps Lead | Built the Docker Compose infrastructure, nginx reverse proxy with TLS, and the OWASP ModSecurity WAF; handles deployment configuration (SMTP, OAuth credentials). |

*(All four of us also contributed as developers across the codebase — see "Individual Contributions" below.)*

## Project Management

Work was organized by area of responsibility (game client, frontend, backend/auth, infra), with each member owning their layer and syncing up whenever features crossed those boundaries (e.g. propagating usernames from matchmaking into the game, or resolving merge conflicts between the infra and auth branches).

- **Task organization**: GitHub Projects board
- **Communication channel**: WhatsApp (team group)
- **Code review**: every pull request required review and approval from at least one other team member before merging into `main`

## Technical Stack

**Frontend**: React 19 + Vite, React Router, Tailwind CSS. Communicates with the backend over HTTP (fetch) and WebSockets (matchmaking queue, live match state).

**Backend**: Node.js + Fastify 5, with `@fastify/websocket` for real-time gameplay/matchmaking and `@fastify/static` for serving both the built frontend's assets it needs and the Godot Web export. Authentication via JWT (`jsonwebtoken`), password hashing, 2FA email delivery via `nodemailer` (SMTP, configurable — Brevo in our deployment), OAuth 42 integration.

**Game client**: Godot 4.4 (GDScript), exported to WebAssembly and embedded in the React app via a JS bridge (`window.initGameSession` / `window.onMatchEnded`).

**Database**: PostgreSQL, accessed through **Prisma** as the ORM. Chosen for its type-safe generated client (catches schema/query mismatches at compile time in TypeScript) and straightforward migration workflow, which mattered given four people touching the schema independently.

**Infrastructure**: Docker Compose (two stacks — app services and the proxy), nginx as a TLS-terminating reverse proxy in front of an **OWASP ModSecurity Core Rule Set** WAF, self-signed certificates for local/test HTTPS. Orchestrated end-to-end with a single `make docker-up`.

## Database Schema

Three main tables (see `server/prisma/schema.prisma` for the full source of truth):

**`users`** — account data: `id`, `username` (unique), `email` (unique), `passwordHash` (nullable — null for OAuth-only accounts), `avatarUrl`, `fortyTwoId` (unique, nullable — set for 42 OAuth accounts), `rankingPoints`, `twoFactorCode` / `twoFactorCodeExpiresAt` (2FA), `lastSeenAt` (online-status heartbeat), timestamps.

**`friendships`** — one row per friend relationship: `requesterId` and `addresseeId` (both foreign keys to `users`), `status` (`PENDING` / `ACCEPTED` / `BLOCKED`), unique on the `(requesterId, addresseeId)` pair.

**`matches`** — one row per completed match: `arenaId` (enum), `player1Id` / `player2Id` / `winnerId` (foreign keys to `users`), `player1Score` / `player2Score`, `startedAt` / `endedAt`. Used to compute win/loss stats, match history, achievements, and the leaderboard.

Relations: a `User` has many `friendshipsSent`/`friendshipsReceived` (self-referencing through `Friendship`) and many `matchesAsPlayer1`/`matchesAsPlayer2`/`matchesWon` (through `Match`).

## Features List

| Feature | Description | Contributor(s) |
|---|---|---|
| Real-time 1v1 combat | Movement, dash, shooting, shields, power-ups, arena hazards | Luiz |
| AI opponent (3 difficulties) | Bot with dodge, predictive aim, and powerup-seeking behavior | Luiz |
| Character selection | 3 skins, chosen before PvP or vs-AI matches | Luiz |
| Matchmaking (online PvP) | FIFO queue, WebSocket relay, reconnect + forfeit-by-disconnect | Luiz, Lilian |
| Signup / login | Email+password with hashed/salted passwords, JWT sessions | João |
| 2FA by email | 6-digit code, 10-minute expiry | João, Thiago (SMTP delivery) |
| OAuth 42 login | Login via Intra 42 | João, Thiago (credentials/deployment) |
| Custom username | Player-chosen username at signup / first OAuth login | Luiz |
| Avatar upload | Base64 image upload, served by the backend | João |
| Friends & online status | Add/accept friends, heartbeat-based online indicator | João |
| Direct challenges | Challenge a friend directly, skip the matchmaking queue | João |
| Match history & stats | Wins/losses, ranking points, recent matches | João |
| Achievements | Win-count milestone badges (1/5/10/50/100) | Luiz |
| Leaderboard | Global ranking by points | João |
| WAF | OWASP ModSecurity CRS in front of the whole stack | Thiago |
| Dockerized deployment | Single-command multi-container orchestration | Thiago |
| Privacy Policy / Terms of Service | Accessible from every page via the footer | Luiz |

## Modules

**Total claimed: 16 points** (14 minimum + 2 margin)

| Module | Category | Type | Points | Justification |
|---|---|---|---|---|
| Framework frontend + backend | Web | Major | 2 | React (frontend) + Fastify (backend), both used as the application's core architecture, not superficially. |
| ORM | Web | Minor | 1 | Prisma + PostgreSQL, with a relational schema (`users`/`friendships`/`matches`) and versioned migrations. |
| Real-time features (WebSockets) | Web | Major | 2 | Live position/hit/powerup sync across clients, graceful disconnect handling, efficient broadcast to connected players. |
| Standard user management | User Management | Major | 2 | Profile editing, avatar upload with default fallback, friends with online status, profile page. |
| OAuth 2.0 | User Management | Minor | 1 | Login via 42 Intra (authorize → callback → account upsert). |
| Match history & stats | User Management | Minor | 1 | Stats, match history, leaderboard, and achievements/progression — all four sub-requirements covered. |
| 2FA | User Management | Minor | 1 | Email-based 6-digit code, required before completing login when enabled. |
| Complete web-based game | Gaming & UX | Major | 2 | Godot 4.4 game, live matches, clear win condition (first to 5). |
| Remote players | Gaming & UX | Major | 2 | Two players on separate machines, real-time play, reconnection handling. |
| AI Opponent | Artificial Intelligence | Major | 2 | Three difficulty tiers with distinct, imperfect (human-like) behavior. |

## Individual Contributions

**Luiz (luinasci) — Product Owner, Game Client**
Built the Godot game client end-to-end: player movement/combat, arenas, power-ups, the AI opponent (all three difficulty levels), reconnect/forfeit UX, and character selection. Integrated the Godot Web export into the React app (the JS↔Godot session bridge). Led final integration work: resolving merge conflicts between infra and auth branches, fixing cross-cutting bugs (username propagation, nginx routing gaps for avatars/OAuth, forfeit-victory persistence), and coordinating the last stretch of fixes (achievements, custom username flow, footer/legal pages, character selection) before submission.
*Challenges faced*: Building multiplayer sync with the backend, designing the event protocol from scratch, and defining the game's scope.

**Lilian (lilmende) — Tech Lead / Architect**
Designed and built the frontend's foundational architecture: the React/Vite project structure, routing, and the consistent Tailwind-based dark UI design system used across every page. Built the original Godot-in-React embedding approach (script injection, canvas lifecycle, the JS↔Godot session bridge) and the original matchmaking queue UI that later work (character selection, custom usernames, etc.) was built on top of. Owned the real-time integration layer connecting the client to the backend's WebSocket-based matchmaking and live-match protocol.
*Challenges faced*: [PREENCHER COM WITH LILIAN]

**João (jcologne) — Project Manager / Scrum Master**
Built the full authentication and social system: signup/login with hashed passwords, JWT sessions, 2FA by email, OAuth 42 integration, friends (requests/acceptance/online status), direct challenges, avatar upload, and profile/match-history endpoints.
*Challenges faced*: Getting the real user identity to flow correctly through matchmaking into persisted match results, and reconciling weeks of parallel work between the auth system and the team's infra/WAF rework into a single working merge.

**Thiago (tguilher) — QA / DevOps Lead**
Built the Docker Compose infrastructure (app + proxy stacks), the nginx reverse proxy with TLS termination, and the OWASP ModSecurity WAF. Handled cloud deployment configuration (SMTP for 2FA emails, OAuth 42 credentials, TLS certificates for the deployed VM).
*Challenges faced*: Getting OWASP CRS to actually load its full ruleset (932 rules, not the incomplete 0/3/0 state) without ModSecurity blocking WebSocket and JSON traffic on the matchmaking/match routes, and keeping the OAuth 42 callback URL byte-for-byte consistent with what's registered on the Intra as the deployment moved between local, IP-based, and domain-based setups.
