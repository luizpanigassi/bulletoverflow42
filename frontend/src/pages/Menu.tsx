import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHARACTERS, type CharacterId } from "../config/characters";

type Difficulty = "easy" | "medium" | "hard";

export function Menu() {
  const navigate = useNavigate();
  const username = localStorage.getItem("bullet_username") || "Soldado";
  const [botDifficulty, setBotDifficulty] = useState<Difficulty>("easy");
  const [characterId, setCharacterId] = useState<CharacterId>("adventurer");

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
        {/* Seletor de Personagem */}
          <div className="flex flex-col gap-3 items-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Escolha seu Personagem</span>
            <div className="flex gap-3">
              {CHARACTERS.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setCharacterId(char.id)}
                  title={char.name}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    characterId === char.id
                      ? "border-purple-500 bg-purple-950/30 shadow-lg shadow-purple-600/20"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div
                      style={{ width: 64, height: 64, imageRendering: "pixelated" }}
                  >
                    <img src={char.image} alt={char.name} className="w-full h-full" style={{ imageRendering: "pixelated" }} />
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider text-center leading-tight w-16 ${characterId === char.id ? "text-purple-300" : "text-zinc-500"}`}>
                    {char.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            
            {/* CARD 1: MULTIPLAYER ONLINE (PVP) */}
            <button
              onClick={() => navigate("/jogar", { state: { characterId } })}
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
                  onClick={() => navigate("/treino-ia", { state: { difficulty: botDifficulty, characterId } })}
                  className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-widest mt-4 block cursor-pointer"
                  >
                Iniciar Treino Local →
                </button>
            </div>
          </div>
        </div>

        {/* Comandos e Power-ups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Comandos */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Comandos</span>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-center font-mono font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1">WASD</span>
                <span className="text-zinc-400">Mover</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-center font-mono font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1">Clique</span>
                <span className="text-zinc-400">Atirar</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-center font-mono font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1">Espaço</span>
                <span className="text-zinc-400">Esquiva (dash)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-center font-mono font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1">R</span>
                <span className="text-zinc-400">Recarregar</span>
              </div>
            </div>
          </div>

          {/* Power-ups */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Power-ups</span>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-3">
                <img src="/powerups/rapid_fire.png" alt="Tiro Rápido" className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
                <span className="text-zinc-400"><span className="text-white font-bold">Tiro Rápido</span> — recarga 2x mais veloz por 5s</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/powerups/speed_boost.png" alt="Velocidade" className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
                <span className="text-zinc-400"><span className="text-white font-bold">Velocidade</span> — movimento 40% mais rápido por 5s</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/powerups/shield.png" alt="Escudo" className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
                <span className="text-zinc-400"><span className="text-white font-bold">Escudo</span> — bloqueia o próximo golpe recebido</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
