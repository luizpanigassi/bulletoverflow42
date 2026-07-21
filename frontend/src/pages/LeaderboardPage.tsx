import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Definindo o formato exato que vem do banco de dados (schema do Prisma do colega)
interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
  rankingPoints: number;
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Faz a chamada HTTP na rota real do Fastify
    fetch("http://127.0.0")
      .then((res) => {
        if (!res.ok) throw new Error("Erro na requisição");
        return res.json();
      })
      .then((data: User[]) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar o ranking global:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-57px)] px-4 py-12 select-none">
      
      {/* Container Principal Centralizado */}
      <div className="w-full max-w-2xl bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-6">
        
        {/* Cabeçalho da Página */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-wider text-purple-400">
              CLASSIFICAÇÃO GLOBAL
            </h1>
            <p className="text-zinc-500 text-xs tracking-wider uppercase mt-1">
              Top 50 Melhores Atiradores
            </p>
          </div>
          
          {/* Botão Voltar */}
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700/50 cursor-pointer"
          >
            ← Voltar
          </button>
        </div>

        {/* 1. Estado de Carregamento */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm font-semibold tracking-widest animate-pulse uppercase">
              Consultando Banco de Dados...
            </p>
          </div>
        )}

        {/* 2. Estado de Erro (Caso o servidor do colega esteja desligado) */}
        {!loading && error && (
          <div className="text-center py-16 bg-red-950/20 border border-red-900/50 rounded-xl p-6 flex flex-col gap-3">
            <p className="text-red-400 font-bold tracking-wide">
              Falha na conexão com a central de comando!
            </p>
            <p className="text-zinc-500 text-xs">
              Certifique-se de que o backend Fastify está rodando localmente na porta 3000.
            </p>
          </div>
        )}

        {/* 3. Tabela do Ranking Reais (Apenas se o carregamento acabou e não deu erro) */}
        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/80 text-zinc-400 text-xs font-bold uppercase tracking-widest border-b border-zinc-800">
                  <th className="py-3 px-4 text-center w-20">Rank</th>
                  <th className="py-3 px-4">Soldado</th>
                  <th className="py-3 px-4 text-right pr-6">Pontuação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 font-medium">
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-zinc-500 text-sm">
                      Nenhum soldado registrado no ranking até o momento.
                    </td>
                  </tr>
                ) : (
                  players.map((player, index) => {
                    const position = index + 1;
                    
                    // Destaca visualmente o pódio (1º, 2º e 3º lugar)
                    const isPodium = position <= 3;
                    const podiumColors = 
                      position === 1 ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]" :
                      position === 2 ? "text-zinc-300" : "text-amber-600";

                    return (
                      <tr 
                        key={player.id} 
                        className="hover:bg-zinc-800/20 transition-colors group"
                      >
                        {/* Posição */}
                        <td className={`py-4 px-4 text-center font-black ${isPodium ? podiumColors : "text-zinc-500"}`}>
                          {position}º
                        </td>
                        
                        {/* Nome do Jogador */}
                        <td className="py-4 px-4 font-bold tracking-wide text-zinc-200 group-hover:text-white transition-colors">
                          {player.username}
                        </td>
                        
                        {/* Pontos de Ranking */}
                        <td className="py-4 px-4 text-right pr-6 font-mono font-bold text-purple-400">
                          {player.rankingPoints.toLocaleString()} <span className="text-[10px] text-zinc-600 font-sans tracking-wider uppercase ml-0.5">pts</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
