import { useNavigate } from "react-router-dom";

interface MatchHistoryItem {
  id: string;
  opponent: string;
  yourScore: number;
  opponentScore: number;
  result: "VITÓRIA" | "DERROTA";
  date: string;
  arena: string;
}

export function ProfilePage() {
  const navigate = useNavigate();

  // Busca as credenciais do jogador local
  const username = localStorage.getItem("bullet_username") || "Soldado";
  const email = localStorage.getItem("bullet_email") || "nao-cadastrado@42.fr";

  // Função para deslogar da conta
  const handleLogout = () => {
    localStorage.removeItem("bullet_authenticated");
    localStorage.removeItem("bullet_username");
    localStorage.removeItem("bullet_email");
    navigate("/login");
  };

  // Histórico Gamer Mockado (Para preencher o requisito visual enquanto o backend não grava na tabela Match)
  const history: MatchHistoryItem[] = [
    { id: "m1", opponent: "player_sniper_42", yourScore: 5, opponentScore: 3, result: "VITÓRIA", date: "Hoje", arena: "arena_01" },
    { id: "m2", opponent: "Bot_Inteligente", yourScore: 5, opponentScore: 0, result: "VITÓRIA", date: "Ontem", arena: "arena_01" },
    { id: "m3", opponent: "dash_master", yourScore: 2, opponentScore: 5, result: "DERROTA", date: "04/08/2026", arena: "arena_01" },
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-57px)] px-4 py-12 select-none">
      {/* Grid Responsivo principal */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUNA DA ESQUERDA: Dados do Perfil, Amigos e Estatísticas */}
        <div className="md:col-span-1 flex flex-col gap-6">
          
          {/* Bloco do Usuário */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-5 text-center items-center">
            <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-purple-600/30">
              {username[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide text-white uppercase">{username}</h1>
              <p className="text-zinc-500 text-xs font-medium truncate max-w-[200px]">{email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 text-xs font-bold uppercase tracking-wider bg-red-950/20 hover:bg-red-950/60 text-red-400 border border-red-900/40 rounded-lg transition-colors cursor-pointer"
            >
              Sair da Conta
            </button>
          </div>

          {/* Lista de Amigos (Mantendo os modelos originais do seu Friendship schema) */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-3">
            <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase">
              Lista de Amigos (Friendship Model)
            </h3>
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl divide-y divide-zinc-900">
              <div className="p-3.5 flex justify-between items-center text-sm">
                <span className="text-zinc-300 font-bold">player_sniper_42</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 font-medium">ACCEPTED</span>
              </div>
              <div className="p-3.5 flex justify-between items-center text-sm">
                <span className="text-zinc-300 font-bold">dash_master</span>
                <span className="text-[10px] bg-purple-950/40 text-purple-400 px-2 py-0.5 rounded border border-purple-900/40 font-bold animate-pulse">PENDING</span>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA DA DIREITA: Estatísticas Grandes e Histórico de Combates */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Grid de Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-center shadow-xl backdrop-blur-sm">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Ranking</span>
              <span className="text-xl font-mono font-black text-purple-400 mt-1 block">1.250 pts</span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-center shadow-xl backdrop-blur-sm">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Partidas</span>
              <span className="text-xl font-mono font-black text-white mt-1 block">42</span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-center shadow-xl backdrop-blur-sm">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Vitórias</span>
              <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">28</span>
            </div>
          </div>

          {/* Histórico de Combates (Adicionado para fechar o requisito visual do transcendence) */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-black text-purple-400 tracking-wider uppercase text-xs">Histórico Recente de Partidas</h3>
              <span className="text-zinc-600 font-mono text-[10px] uppercase">Match History Schema</span>
            </div>

            <div className="flex flex-col gap-3 max-h-[310px] overflow-y-auto pr-1">
              {history.map((match) => (
                <div 
                  key={match.id} 
                  className={`flex justify-between items-center bg-zinc-950/40 border p-4 rounded-xl transition-all ${
                    match.result === "VITÓRIA" ? "border-emerald-950/50 hover:bg-emerald-950/5" : "border-red-950/50 hover:bg-red-950/5"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-xs font-black uppercase tracking-widest ${match.result === "VITÓRIA" ? "text-emerald-400" : "text-red-400"}`}>
                      {match.result}
                    </span>
                    <span className="text-zinc-400 text-xs font-medium">
                      Contra: <span className="text-zinc-200 font-bold">{match.opponent}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <span className="text-zinc-600 text-[10px] block uppercase font-bold tracking-wider">Resultado</span>
                      <span className="font-mono font-black text-sm text-zinc-100">
                        {match.yourScore} <span className="text-zinc-600 font-normal text-xs mx-0.5">-</span> {match.opponentScore}
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-zinc-500 font-medium">
                      <span>{match.arena}</span>
                      <span className="block text-zinc-600">{match.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}