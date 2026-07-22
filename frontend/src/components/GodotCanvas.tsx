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
      className="godot-wrapper" 
      style={{
        width: "100%",
        aspectRatio: "16/9",
        backgroundColor: "#000",
        borderRadius: "12px",
        overflow: "hidden",
        border: "2px solid #9333ea",
        position: "relative"
      }}
    >
      {/* Tela de Carregamento flutuante por cima do canvas */}
      {loading && (
        <div 
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#242424",
            color: "#fff",
            zIndex: 10
          }}
        >
          <span style={{ fontWeight: "bold", letterSpacing: "0.1em" }}>
            CONECTANDO À ARENA E SINCRONIZANDO MAPA...
          </span>
          <progress id="react-status-progress" style={{ width: "50%", height: "8px" }}></progress>
        </div>
      )}

      {/* O Canvas fica montado desde o início para a Godot encontrá-lo sem atrasos */}
      <canvas id="canvas" style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
