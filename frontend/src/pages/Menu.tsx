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
    // Mudança de py-6 para xl:py-16 e 2xl:py-24 expande o espaçamento vertical em telas gigantes
    <div className="flex flex-col items-center justify-start w-full min-h-full px-4 py-6 md:py-10 xl:py-16 2xl:py-24 select-none">
      
      {/* Título Principal do Painel */}
      {/* Adicionado xl:mb-14 e text-4xl/text-5xl para o título crescer em monitores grandes */}
      <div className="text-center mb-6 md:mb-8 xl:mb-14">
        <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(147,51,234,0.3)]">
          Central de Comando
        </h1>
        <p className="text-zinc-500 text-xs xl:text-sm font-medium uppercase tracking-wider mt-1.5">
          Bem-vindo de volta, <span className="text-purple-400 font-bold">{username}</span>. Prepare-se para a arena.
        </p>
      </div>

      {/* DISPOSIÇÃO EM GRID: Aumentado max-w-5xl para xl:max-w-6xl e 2xl:max-w-7xl para ocupar mais a tela cheia */}
      <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl grid grid-cols-1 md:grid-cols-5 gap-6 xl:gap-8 items-start">
        
        {/* COLUNA DA ESQUERDA (Ocupa 3 de 5 colunas) - Customização e Play */}
        {/* Adicionado xl:p-8 para o card respirar melhor internamente */}
        <div className="md:col-span-3 flex flex-col gap-6 xl:gap-8 bg-zinc-900/20 border border-zinc-800/60 p-6 xl:p-8 rounded-2xl backdrop-blur-sm shadow-xl">
          
                    {/* Seletor de Personagem */}
          <div className="flex flex-col gap-3 xl:gap-4 items-center">
            <span className="text-[10px] xl:text-xs font-black text-purple-400 uppercase tracking-widest">Escolha seu Personagem</span>
            <div className="flex gap-3 xl:gap-4 justify-center flex-wrap">
              {CHARACTERS.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setCharacterId(char.id as CharacterId)}
                  title={char.name}
                  className={`flex flex-col items-center gap-2 p-3 xl:p-4 rounded-xl border-2 transition-all cursor-pointer active:scale-95 ${
                    characterId === char.id
                      ? "border-purple-500 bg-purple-950/30 shadow-lg shadow-purple-600/20"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="w-16 h-16 xl:w-20 xl:h-20">
                    <img src={char.image} alt={char.name} className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} />
                  </div>
                  <span className={`text-[9px] xl:text-[10px] font-bold uppercase tracking-wider text-center leading-tight w-16 xl:w-20 ${characterId === char.id ? "text-purple-300" : "text-zinc-500"}`}>
                    {char.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-zinc-800/60" />

          {/* Seletor de Dificuldade do Bot */}
          <div className="flex flex-col gap-2 xl:gap-3 items-center">
            <span className="text-[10px] xl:text-xs font-black text-zinc-500 uppercase tracking-widest">Dificuldade da IA (Modo Treino)</span>
            <div className="flex gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
              {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setBotDifficulty(diff)}
                  className={`px-4 py-1.5 xl:px-6 xl:py-2 text-[10px] xl:text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    botDifficulty === diff
                      ? "bg-purple-600 text-white shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {diff === "easy" ? "Fácil" : diff === "medium" ? "Médio" : "Difícil"}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-zinc-800/60 my-1" />

          {/* Botões de Ação do Jogo */}
          {/* Aumentado o padding vertical (py-5) e o texto (xl:text-sm) para dar imponência ao play */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 w-full">
            <button 
              onClick={() => navigate("/jogar")}
              className="w-full sm:w-1/2 py-4 xl:py-5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-[0.98] font-black rounded-xl text-xs xl:text-sm uppercase tracking-wider text-white transition-all cursor-pointer shadow-lg shadow-purple-900/20 text-center truncate"
            >
              ⚔️ Encontrar Partida (PvP)
            </button>
            <button 
              onClick={() => navigate("/treino-ia")}
              className="w-full sm:w-1/2 py-4 xl:py-5 px-4 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] font-black rounded-xl text-xs xl:text-sm uppercase tracking-wider text-zinc-200 transition-all border border-zinc-700/50 cursor-pointer text-center truncate"
            >
              🤖 Treinar vs Bot
            </button>
          </div>

        </div>

        {/* COLUNA DA DIREITA (Ocupa 2 de 5 colunas) - Comandos e Power-ups empilhados */}
        <div className="md:col-span-2 flex flex-col gap-4 xl:gap-6 w-full">
          
          {/* Painel de Comandos */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 xl:p-6 rounded-2xl flex flex-col gap-3 shadow-xl backdrop-blur-sm">
            <span className="text-[10px] xl:text-xs font-black text-zinc-500 uppercase tracking-widest">Comandos de Combate</span>
            <div className="flex flex-col gap-2.5 text-xs xl:text-sm">
              <div className="flex items-center gap-3">
                <span className="w-16 xl:w-20 shrink-0 text-center font-mono font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1">WASD</span>
                <span className="text-zinc-400">Mover Soldado</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 xl:w-20 shrink-0 text-center font-mono font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1">Clique</span>
                <span className="text-zinc-400">Disparar Arma</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 xl:w-20 shrink-0 text-center font-mono font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1">Espaço</span>
                <span className="text-zinc-400">Esquiva (dash)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 xl:w-20 shrink-0 text-center font-mono font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1">R</span>
                <span className="text-zinc-400">Recarregar Cartucho</span>
              </div>
            </div>
          </div>

          {/* Painel de Power-ups */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 xl:p-6 rounded-2xl flex flex-col gap-3 shadow-xl backdrop-blur-sm">
            <span className="text-[10px] xl:text-xs font-black text-zinc-500 uppercase tracking-widest">Guia de Modificadores</span>
            <div className="flex flex-col gap-3 text-xs xl:text-sm">
              <div className="flex items-start gap-3">
                <img src="/powerups/rapid_fire.png" alt="Tiro Rápido" className="w-5 h-5 xl:w-6 xl:h-6 object-contain mt-0.5" style={{ imageRendering: "pixelated" }} />
                <span className="text-zinc-400 leading-tight">
                  <span className="text-purple-300 font-bold">Tiro Rápido</span> — Cadência e recarga duas vezes mais rápidas por 5s.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <img src="/powerups/speed_boost.png" alt="Velocidade" className="w-5 h-5 xl:w-6 xl:h-6 object-contain mt-0.5" style={{ imageRendering: "pixelated" }} />
                <span className="text-zinc-400 leading-tight">
                  <span className="text-purple-300 font-bold">Velocidade</span> — Velocidade de movimento ampliada em 40% por 5s.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <img src="/powerups/shield.png" alt="Escudo" className="w-5 h-5 xl:w-6 xl:h-6 object-contain mt-0.5" style={{ imageRendering: "pixelated" }} />
                <span className="text-zinc-400 leading-tight">
                  <span className="text-purple-300 font-bold">Campo de Força</span> — Escudo protetor que absorve o próximo projétil.
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
