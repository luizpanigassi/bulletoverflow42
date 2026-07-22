import { useNavigate } from "react-router-dom";

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

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-57px)] px-4 py-12 select-none">
      <div className="w-full max-w-2xl bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-8">
        
        {/* Cabeçalho do Perfil */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-4">
            {/* Avatar fictício baseado na inicial */}
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-purple-600/30">
              {username[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white uppercase">{username}</h1>
              <p className="text-zinc-500 text-xs font-medium">{email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-red-950/20 hover:bg-red-950/60 text-red-400 border border-red-900/40 rounded-lg transition-colors cursor-pointer"
          >
            Sair da Conta
          </button>
        </div>

        {/* Grid de Estatísticas (Conceitual para o histórico do Prisma) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl text-center">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Ranking</span>
            <span className="text-2xl font-mono font-black text-purple-400 mt-1 block">1.250 pts</span>
          </div>
          <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl text-center">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Partidas</span>
            <span className="text-2xl font-mono font-black text-white mt-1 block">42</span>
          </div>
          <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl text-center col-span-2 sm:col-span-1">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Vitórias</span>
            <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">28</span>
          </div>
        </div>

        {/* Seção Amigos e Relacionamentos (Model Friendship do seu colega) */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase">
            Lista de Amigos (Stub Status: Pending/Accepted)
          </h3>
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl divide-y divide-zinc-900">
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-zinc-300 font-bold">player_sniper_42</span>
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 font-medium">ACCEPTED</span>
            </div>
            <div className="p-4 flex justify-between items-center text-sm">
              <span className="text-zinc-300 font-bold">dash_master</span>
              <span className="text-xs bg-purple-950/40 text-purple-400 px-2 py-0.5 rounded border border-purple-900/40 font-bold animate-pulse">PENDING</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
