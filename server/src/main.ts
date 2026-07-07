import path from "node:path";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { env } from "./env.js";
import { registerAuthRoutes } from "./auth/auth.routes.js";
import { registerUserRoutes } from "./users/users.routes.js";
import { registerLeaderboardRoutes } from "./leaderboard/leaderboard.routes.js";
import { registerWebsocket } from "./websocket/websocket.plugin.js";
import { registerMatchmaking } from "./matchmaking/matchmaking.routes.js";
import { matchManager } from "./matches/match-manager.js";

async function main() {
  const app = Fastify({ logger: true });

  app.get("/", async () => ({ status: "ok", service: "bullet-overflow-server" }));

  await registerAuthRoutes(app);
  await registerUserRoutes(app);
  await registerLeaderboardRoutes(app);
  await registerWebsocket(app);
  await registerMatchmaking(app);

  // Godot 4.4 exige Cross-Origin Isolation (COOP/COEP) no export Web mesmo
  // sem threads habilitadas — sem esses headers o SharedArrayBuffer fica
  // bloqueado e o engine recusa rodar (ver build/web/index.html).
  app.addHook("onSend", async (request, reply) => {
    if (request.url.startsWith("/play/")) {
      reply.header("Cross-Origin-Opener-Policy", "same-origin");
      reply.header("Cross-Origin-Embedder-Policy", "require-corp");
    }
  });

  // Protótipo: serve o build web (client/scenes/debug + matchmaking bootstrap
  // via export_presets.cfg) na mesma porta do backend, só pra testar duas
  // abas em localhost sem depender das páginas reais, que vêm depois.
  await app.register(fastifyStatic, {
    root: path.resolve(import.meta.dirname, "../../build/web"),
    prefix: "/play/",
  });

  // Match fixa só pra validar a conexão crua sem matchmaking (ver
  // client/scenes/debug/network_smoke_test.tscn).
  matchManager.create("smoke_test", "arena_ruins");

  await app.listen({ port: env.port, host: env.host });

  console.log("Server Running");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
