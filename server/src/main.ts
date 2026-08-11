import path from "node:path";
import fs from "node:fs";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import { env } from "./env.js";
import { registerAuthRoutes } from "./auth/auth.routes.js";
import { registerUserRoutes } from "./users/users.routes.js";
import { registerLeaderboardRoutes } from "./leaderboard/leaderboard.routes.js";
import { registerWebsocket } from "./websocket/websocket.plugin.js";
import { registerMatchmaking } from "./matchmaking/matchmaking.routes.js";
import { registerChallengeRoutes } from "./matchmaking/challenges.routes.js";
import { matchManager } from "./matches/match-manager.js";
import { AVATARS_DIR } from "./uploads-dir.js";

async function main() {
  const app = Fastify({ logger: true });

  // Sem isso, o front rodando fora do nginx (ex: `npm run dev` na porta 5173
  // direto contra o backend na 3000) é bloqueado pelo navegador (CORS).
  // Via nginx (/api/), front e backend aparecem como mesma origem — não afeta esse caminho.
  await app.register(fastifyCors, {
    origin: [env.frontendUrl, "http://localhost:5173", "http://localhost:8080", "https://localhost:8443"],
  });

  app.get("/", async () => ({ status: "ok", service: "bullet-overflow-server" }));

  await registerAuthRoutes(app);
  await registerUserRoutes(app);
  await registerLeaderboardRoutes(app);
  await registerWebsocket(app);
  await registerMatchmaking(app);
  await registerChallengeRoutes(app);

  // Godot 4.4 exige Cross-Origin Isolation (COOP/COEP) no export Web.
  app.addHook("onSend", async (request, reply) => {
    if (request.url.startsWith("/play/")) {
      reply.header("Cross-Origin-Opener-Policy", "same-origin");
      reply.header("Cross-Origin-Embedder-Policy", "require-corp");
    }
  });

  // Serve o build web (client) na mesma porta do backend.
  await app.register(fastifyStatic, {
    root: path.resolve(import.meta.dirname, "../../build/web"),
    prefix: "/play/",
  });

  // Avatares enviados por upload (ver users.routes.ts). decorateReply:false
  // porque o @fastify/static já decorou o reply no register acima.
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
  await app.register(fastifyStatic, {
    root: AVATARS_DIR,
    prefix: "/avatars/",
    decorateReply: false,
  });

  // Match fixa pra smoke test (network_smoke_test.tscn), sem matchmaking.
  matchManager.create("smoke_test", "arena_01");

  await app.listen({ port: env.port, host: env.host });

  console.log("Server Running");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
