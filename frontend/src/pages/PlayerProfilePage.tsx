import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_HTTP_BASE } from "../config/api";
import type { MatchHistoryItem, ProfileData } from "../config/profile.config";
import { ACHIEVEMENT_THRESHOLDS } from "../config/profile.config";

// Versão somente-leitura do ProfilePage, pra ver o perfil de QUALQUER jogador
// (clicado a partir do ranking) — sem edição de avatar/2FA, sem amigos/desafios,
// já que essas ações só fazem sentido no próprio perfil (ver ProfilePage.tsx).
export function PlayerProfilePage() {
  const { username: identifier } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!identifier) return;
    setLoading(true);
    setNotFound(false);

    fetch(`${API_HTTP_BASE}/users/${identifier}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileData | null) => {
        setProfile(data);
        if (!data) {
          setNotFound(true);
          return;
        }
        return fetch(`${API_HTTP_BASE}/users/${data.id}/matches`)
          .then((res) => (res.ok ? res.json() : []))
          .then(setHistory);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [identifier]);

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-57px)] px-4 py-12 select-none">
      <div className="w-full max-w-3xl flex flex-col gap-6">

        <button
          onClick={() => navigate("/leaderboard")}
          className="self-start px-4 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700/50 cursor-pointer"
        >
          ← Voltar ao Ranking
        </button>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm font-semibold tracking-widest animate-pulse uppercase">
              Consultando Banco de Dados...
            </p>
          </div>
        )}

        {!loading && notFound && (
          <div className="text-center py-16 bg-red-950/20 border border-red-900/50 rounded-xl p-6">
            <p className="text-red-400 font-bold tracking-wide">Soldado não encontrado.</p>
          </div>
        )}

        {!loading && profile && (
          <>
            {/* Cabeçalho: avatar + username */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex items-center gap-5">
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg shadow-purple-600/30 shrink-0">
                {profile.avatarUrl ? (
                  <img src={`${API_HTTP_BASE}${profile.avatarUrl}`} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-purple-600 flex items-center justify-center text-2xl font-black text-white">
                    {profile.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <h1 className="text-xl font-black tracking-wide text-white uppercase truncate">{profile.username}</h1>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-center shadow-xl backdrop-blur-sm">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Ranking</span>
                <span className="text-xl font-mono font-black text-purple-400 mt-1 block truncate">{profile.rankingPoints} pts</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-center shadow-xl backdrop-blur-sm">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Partidas</span>
                <span className="text-xl font-mono font-black text-white mt-1 block">{profile.matchesPlayed}</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-center shadow-xl backdrop-blur-sm">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Vitórias</span>
                <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">{profile.wins}</span>
              </div>
            </div>

            {/* Conquistas */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-4">
              <h3 className="font-black text-purple-400 tracking-wider uppercase text-xs border-b border-zinc-800 pb-3">Conquistas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ACHIEVEMENT_THRESHOLDS.map((threshold) => {
                  const unlocked = profile.wins >= threshold;
                  return (
                    <div
                      key={threshold}
                      title={unlocked ? `${threshold} vitórias — desbloqueada` : `${threshold} vitórias — bloqueada`}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${unlocked
                          ? "bg-purple-950/30 border-purple-700/50 shadow-lg shadow-purple-600/10"
                          : "bg-zinc-950/40 border-zinc-800 opacity-40"
                        }`}
                    >
                      <span className="text-2xl">{unlocked ? "🏆" : "🔒"}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${unlocked ? "text-purple-300" : "text-zinc-600"}`}>
                        {threshold} {threshold === 1 ? "vitória" : "vitórias"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Histórico de partidas */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-4">
              <h3 className="font-black text-purple-400 tracking-wider uppercase text-xs border-b border-zinc-800 pb-3">Histórico Recente de Partidas</h3>
              <div className="flex flex-col gap-3">
                {history.length === 0 ? (
                  <div className="text-sm text-zinc-500 py-4">Nenhuma partida registrada até o momento.</div>
                ) : (
                  history.map((match) => (
                    <div
                      key={match.id}
                      className={`flex justify-between items-center bg-zinc-950/40 border p-4 rounded-xl transition-all ${match.result === "VITÓRIA" ? "border-emerald-950/50 hover:bg-emerald-950/5" : "border-red-950/50 hover:bg-red-950/5"
                        }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className={`text-xs font-black uppercase tracking-widest ${match.result === "VITÓRIA" ? "text-emerald-400" : "text-red-400"}`}>
                          {match.result}
                        </span>
                        <span className="text-zinc-400 text-xs font-medium truncate pr-2">
                          Contra: <span className="text-zinc-200 font-bold truncate">{match.opponent}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-center">
                          <span className="text-zinc-600 text-[10px] block uppercase font-bold tracking-wider">Resultado</span>
                          <span className="font-mono font-black text-sm text-zinc-100">
                            {match.yourScore} <span className="text-zinc-600 font-normal text-xs mx-0.5">-</span> {match.opponentScore}
                          </span>
                        </div>
                        <div className="text-right text-[10px] text-zinc-500 font-medium hidden sm:block">
                          <span className="block text-zinc-400 truncate max-w-[70px]" title={match.arena}>{match.arena}</span>
                          <span className="block text-zinc-600">{new Date(match.date).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
