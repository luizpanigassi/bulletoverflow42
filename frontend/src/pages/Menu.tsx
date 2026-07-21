import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function Menu() {
  const navigate = useNavigate();
  
  // Inicializa o nome do jogador buscando do localStorage, ou gera um nome de convidado aleatório
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem("bullet_username");
    return saved || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
  });

  // Salva o nome automaticamente no localStorage sempre que o jogador digitar algo novo
  useEffect(() => {
    localStorage.setItem("bullet_username", username);
  }, [username]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4 select-none">
      {/* Container do Cartão do Menu */}
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm text-center flex flex-col gap-8">
        
        {/* Título Principal com Brilho Neon */}
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 drop-shadow-[0_4px_12px_rgba(168,85,247,0.3)] animate-pulse">
            BULLET OVERFLOW
          </h1>
          <p className="text-zinc-500 text-xs tracking-widest mt-2 uppercase">
            Frontend Client — Alpha v0.1
          </p>
        </div>

        {/* Campo de Entrada do Nome do Jogador */}
        <div className="flex flex-col gap-2 text-left bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Identificação do Soldado
          </label>
          <input
            type="text"
            maxLength={15}
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} // Remove espaços em branco
            className="w-full bg-zinc-900 border border-purple-500/30 focus:border-purple-500 rounded-lg px-3 py-2 text-white font-bold tracking-wide focus:outline-none transition-all shadow-inner"
            placeholder="Digite seu nickname..."
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-3">
          {/* Botão de Jogar / Ir para Matchmaking */}
          <button
            onClick={() => navigate("/jogar")}
            className="w-full py-4 text-lg font-black tracking-widest text-white uppercase bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] rounded-xl shadow-[0_4px_20px_rgba(147,51,234,0.3)] hover:shadow-[0_4px_25px_rgba(147,51,234,0.5)] transition-all cursor-pointer"
          >
            Entrar em Combate
          </button>

          {/* Botão para ver a Leaderboard */}
          <button
            onClick={() => navigate("/leaderboard")}
            className="w-full py-3 text-sm font-bold tracking-wider text-zinc-300 uppercase bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl active:scale-[0.98] transition-all cursor-pointer"
          >
            Ver Classificação (Top 50)
          </button>
        </div>

      </div>
    </div>
  );
}
