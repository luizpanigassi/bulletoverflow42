import { useEffect, useState } from "react";

interface GodotCanvasProps {
  matchId: string;
  slot: number;
  serverUrl: string;
  arenaId: string;
  seed: number; // Modificado: semente agora vem obrigatoriamente do servidor
}

export function GodotCanvas({ matchId, slot, serverUrl, arenaId, seed }: GodotCanvasProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Injeta o script injetável da Godot
    const script = document.createElement("script");
    script.src = "/godot/index.js";
    script.async = true;

    script.onload = () => {
      // Configuração base da Godot extraída do index.html
      const GODOT_CONFIG = {
        args: [],
        canvasResizePolicy: 2,
        ensureCrossOriginIsolationHeaders: true,
        executable: "/godot/index",
        focusCanvas: true
      };

      // @ts-ignore
      const engine = new window.Engine(GODOT_CONFIG);

      // Função interna para disparar os dados para a Godot
      const inicializarSessaoGodot = () => {
        const session = {
          mode: "online",
          match_id: matchId,
          arena_id: arenaId || "arena_01",
          seed: seed, // Utiliza a semente idêntica enviada pelo backend
          host_id: "",
          websocket_url: serverUrl,
          game_type: "pvp",
          bot_difficulty: "easy",
          local_player_slot: slot,
          players: [
            { user_id: slot === 1 ? "local" : "oponente", slot: 1, character_id: "adventurer", ready: true, username: "Player 1", is_bot: false },
            { user_id: slot === 2 ? "local" : "oponente", slot: 2, character_id: "adventurer", ready: true, username: "Player 2", is_bot: false }
          ]
        };

        // @ts-ignore
        if (typeof window.initGameSession === "function") {
          console.log("[React] Transmitindo sessão idêntica para o initGameSession da Godot");
          // @ts-ignore
          window.initGameSession(JSON.stringify(session));
        } else {
          // Tenta novamente em 50ms se o script global ainda estiver carregando
          setTimeout(inicializarSessaoGodot, 50);
        }
      };

      // Inicia a engine conectada ao elemento canvas já existente na tela
      engine.startGame({
        onProgress: (current: number, total: number) => {
          const progresso = document.getElementById("react-status-progress") as HTMLProgressElement;
          if (progresso && current > 0 && total > 0) {
            progresso.value = current;
            progresso.max = total;
          }
        }
      }).then(() => {
        // --- TRAVA DO ÍCONE GAMER ---
        // 1. Procura se a Godot injetou o ícone dela com o ID padrão '-gd-engine-icon'
        const godotIcon = document.getElementById("-gd-engine-icon") as HTMLLinkElement;
        if (godotIcon) {
          // Força o caminho para apontar para o seu favicon personalizado do portal
          godotIcon.href = "/favicon.png";
        }

        // 2. Garante que o ícone principal da página também seja blindado
        const mainIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (mainIcon) {
          mainIcon.href = "/favicon.png";
        }
        setLoading(false);
        inicializarSessaoGodot();
      }).catch((err: any) => {
        console.error("Erro ao inicializar motor Godot:", err);
      });
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      // @ts-ignore
      delete window.initGameSession;
    };
  }, [matchId, slot, serverUrl, arenaId, seed]);

  return (
    <div
      className="godot-wrapper w-full aspect-video bg-black rounded-xl overflow-hidden border-2 border-purple-600 relative shadow-2xl"
      style={{ isolation: 'isolate' }} // Cria um contexto isolado de renderização
    >
      {/* Tela de Carregamento flutuante por cima do canvas */}
      {loading && (
        <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center bg-zinc-900 text-white z-20">
          <span className="font-black text-xs tracking-widest animate-pulse uppercase">
            CONECTANDO À ARENA E SINCRONIZANDO MAPA...
          </span>
          <progress id="react-status-progress" className="w-1/2 h-2 accent-purple-500 bg-zinc-800 rounded-full" />
        </div>
      )}

      {/* O CANVAS REESTILIZADO: Força posições relativas e tamanho fixo */}
      <canvas
        id="canvas"
        className="w-full h-full block object-contain"
        style={{
          position: 'relative',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
          display: 'block'
        }}
      />
    </div>
  );
}
