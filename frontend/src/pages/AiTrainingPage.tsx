import { useNavigate, useLocation } from "react-router-dom";
import { GodotCanvas } from "../components/GodotCanvas";

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil"
};

const ARENA_IDS = ["arena_01", "arena_02", "arena_03"];

export function AiTrainingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const difficulty: Difficulty = (location.state as { difficulty?: Difficulty } | null)?.difficulty ?? "easy";

  // Provisório: dificuldade vem do dropdown no Menu via router state; se
  // alguém cair aqui direto (refresh, link direto), usa "easy" como padrão.

  // dados estáticos/mockados para a sessão local do bot
  const localMatchData = {
    matchId: "local_training_match",
    slot: 1,
    serverUrl: "", // Sem URL de servidor, pois o modo é offline contra bot
    arenaId: ARENA_IDS[Math.floor(Math.random() * ARENA_IDS.length)], // Escolhe uma arena aleatória
    seed: Math.floor(Math.random() * 99999) // Semente aleatória local
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-57px)] px-4 py-8 select-none">
      <div className="w-full max-w-[1280px] flex flex-col gap-4">
        
        {/* Painel do Topo */}
        <div className="flex justify-between items-center bg-zinc-900/80 border border-zinc-800 px-6 py-4 rounded-xl text-sm font-semibold tracking-wide">
          <div className="flex gap-6 items-center">
            <div>
              <span className="text-zinc-500 uppercase text-xs block">Modo</span>
              <span className="text-fuchsia-400 font-bold uppercase animate-pulse">Treino Offline</span>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <span className="text-zinc-500 uppercase text-xs block">Oponente</span>
              <span className="text-white font-bold">Bot Inteligente ({DIFFICULTY_LABEL[difficulty]})</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              // @ts-ignore
              window.forceQuitGame && window.forceQuitGame(); // Força a Godot a encerrar a partida
              navigate("/"); // Volta ao menu principal
            }}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 rounded-lg transition-all cursor-pointer"
          >
            ← Voltar ao Menu
          </button>
        </div>

        {/* Injeta o seu Canvas passando as propriedades locais adaptadas */}
        <GodotCanvas 
          matchId={localMatchData.matchId}
          slot={localMatchData.slot}
          serverUrl={localMatchData.serverUrl}
          arenaId={localMatchData.arenaId}
          seed={localMatchData.seed}
          mode="local"
          gameType="vs_bot"
          botDifficulty={difficulty}
          onMatchEnded={() => navigate("/")} // Callback para quando a partida terminar, volta ao menu
        />

      </div>
    </div>
  );
}
