import Fastify from "fastify";
import { env } from "./env.js";
import { registerAuthRoutes } from "./auth/auth.routes.js";
import { registerUserRoutes } from "./users/users.routes.js";
import { registerLeaderboardRoutes } from "./leaderboard/leaderboard.routes.js";
import { registerWebsocket } from "./websocket/websocket.plugin.js";
import { matchManager } from "./matches/match-manager.js";

async function main() {
  const app = Fastify({ logger: true });

  app.get("/", async () => ({ status: "ok", service: "bullet-overflow-server" }));

  await registerAuthRoutes(app);
  await registerUserRoutes(app);
  await registerLeaderboardRoutes(app);
  await registerWebsocket(app);

  // TODO (smoke test): remover quando o matchmaking real (Etapa 4) criar matches
  // dinamicamente a partir da fila. Por enquanto fixa uma match pra validar a
  // conexão client<->server ponta a ponta (ver client/scenes/debug/network_smoke_test.tscn).
  matchManager.create("smoke_test", "arena_ruins");

  await app.listen({ port: env.port, host: env.host });

  // Etapa 1 do backend_architecture.md
  console.log("Server Running");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
