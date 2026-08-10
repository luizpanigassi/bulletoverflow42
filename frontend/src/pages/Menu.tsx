import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Difficulty = "easy" | "medium" | "hard";

export function Menu() {
  const navigate = useNavigate();
  const username = localStorage.getItem("bullet_username") || "Soldado";
  const [botDifficulty, setBotDifficulty] = useState<Difficulty>("easy");

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4 py-8 select-none">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        {/* Painel do Soldado Logado */}
        <div className="flex justify-between items-center bg-zinc-900/40 border border-zinc-800/80 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Estação de Combate</span>
          </div>
          <span className="text-sm font-black tracking-wide text-purple-400 uppercase">
            Soldado: {username}
          </span>
        </div>

        {/* Seção Central de Modos de Jogo */}
        <div className="flex flex-col gap-4 text-center">
          <div>
            <h1 className="text-3xl font-black tracking-widest text-white uppercase">
              Selecione o Modo de Missão
            </h1>
            <p className="text-zinc-500 text-xs tracking-wider uppercase mt-1">
              Prepare seus reflexos antes de entrar na arena
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            
            {/* CARD 1: MULTIPLAYER ONLINE (PVP) */}
            <button
              onClick={() => navigate("/jogar")}
              className="group flex flex-col text-left p-6 bg-zinc-900/50 hover:bg-purple-950/20 border border-zinc-800 hover:border-purple-500/50 rounded-2xl transition-all duration-300 shadow-xl cursor-pointer hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/30 rounded-xl flex items-center justify-center text-xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                ⚔️
              </div>
              <h2 className="text-lg font-black tracking-wide text-white mt-4 group-hover:text-purple-400 transition-colors uppercase">
                Combate Online
              </h2>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Entre na fila de matchmaking FIFO para enfrentar outros jogadores da escola em tempo real.
              </p>
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-4 block">
                Fila de Espera PvP →
              </span>
            </button>

            {/* CARD 2: TREINAMENTO CONTRA IA */}
            <div className="group flex flex-col text-left p-6 bg-zinc-900/50 hover:bg-fuchsia-950/20 border border-zinc-800 hover:border-fuchsia-500/50 rounded-2xl transition-all duration-300 shadow-xl">
              <div className="w-12 h-12 bg-fuchsia-600/10 border border-fuchsia-500/30 rounded-xl flex items-center justify-center text-xl group-hover:bg-fuchsia-600 group-hover:text-white transition-all">
                🤖
              </div>
              <h2 className="text-lg font-black tracking-wide text-white mt-4 group-hover:text-fuchsia-400 transition-colors uppercase">
                Simulação contra IA
              </h2>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Jogue uma partida local offline contra um bot com dificuldade ajustada para testar suas mecânicas.
              </p>
               {/* Provisório: só funcional, sem estilo definitivo ainda */}
                <select
                 value={botDifficulty}
                 onChange={(e) => setBotDifficulty(e.target.value as Difficulty)}
                 onClick={(e) => e.stopPropagation()}
                 className="mt-3 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white w-fit"
                 >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                 </select>
                 <button
                  onClick={() => navigate("/treino-ia", { state: { difficulty: botDifficulty } })}
                  className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-widest mt-4 block cursor-pointer"
                  >
                Iniciar Treino Local →
                </button>
            </div>
          </div>
        </div>

        {/* Espaço reservado para Futuras Funcionalidades*/}
        <div className="border border-dashed border-zinc-800 p-4 rounded-xl text-center bg-zinc-950/20">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            🔒 Novos módulos (Torneios e Custom Rooms) serão liberados em breve
          </span>
        </div>

      </div>
    </div>
  );
}
