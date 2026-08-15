import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_HTTP_BASE } from "../config/api";
import type {
  ChallengeItem,
  MatchHistoryItem,
  Friend,
  PendingRequest,
  ProfileData
} from "../config/profile.config";

import {
  MAX_AVATAR_BYTES,
  ALLOWED_AVATAR_TYPES,
  ACHIEVEMENT_THRESHOLDS
} from "../config/profile.config";


export function ProfilePage() {
  const navigate = useNavigate();

  // Busca as credenciais do jogador local
  const username = localStorage.getItem("bullet_username") || "Soldado";
  const email = localStorage.getItem("bullet_email") || "nao-cadastrado@42.fr";
  // Prefere o id real (salvo no login/signup); cai pro username em sessões antigas/guest.
  const userIdentifier = localStorage.getItem("bullet_user_id") || username;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [addFriendInput, setAddFriendInput] = useState("");
  const [addFriendSubmitting, setAddFriendSubmitting] = useState(false);
  const [incomingChallenges, setIncomingChallenges] = useState<ChallengeItem[]>([]);

  // Sem Content-Type aqui: Fastify rejeita (400) requests sem corpo mas com
  // "application/json" no header. Quem manda corpo declara o Content-Type junto.
  function authHeaders() {
    const token = localStorage.getItem("bullet_token");
    return { Authorization: `Bearer ${token}` };
  }

  function loadFriendsAndPending(userId: string) {
    return Promise.all([
      fetch(`${API_HTTP_BASE}/users/${userId}/friends`).then((res) => (res.ok ? res.json() : [])),
      fetch(`${API_HTTP_BASE}/users/${userId}/friends/pending`).then((res) => (res.ok ? res.json() : [])),
    ]).then(([friendsData, pendingData]) => {
      setFriends(friendsData);
      setPendingRequests(pendingData);
    });
  }

  // Descobre desafios recebidos (pra exibir) e desafios que EU mandei e já
  // foram aceitos (pra entrar direto na partida, pulando a fila).
  function pollChallenges(userId: string) {
    fetch(`${API_HTTP_BASE}/users/${userId}/challenges`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ChallengeItem[]) => {
        const accepted = data.find((c) => c.direction === "sent" && c.status === "accepted" && c.match);
        if (accepted?.match) {
          fetch(`${API_HTTP_BASE}/users/${userId}/challenges/${accepted.id}`, { method: "DELETE", headers: authHeaders() }).catch(() => { });
          navigate("/jogar", { state: { matchId: accepted.match.matchId, slot: accepted.match.slot, arenaId: accepted.match.arenaId, seed: accepted.match.seed, player1Username: accepted.match.player1Username, player2Username: accepted.match.player2Username } });
          return;
        }
        setIncomingChallenges(data.filter((c) => c.direction === "received" && c.status === "pending"));
      });
  }

  useEffect(() => {
    fetch(`${API_HTTP_BASE}/users/${userIdentifier}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileData | null) => {
        setProfile(data);
        if (!data) return;
        return Promise.all([
          loadFriendsAndPending(data.id),
          fetch(`${API_HTTP_BASE}/users/${data.id}/matches`).then((res) => (res.ok ? res.json() : [])).then(setHistory),
        ]);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdentifier]);

  // Atualiza status online dos amigos e desafios periodicamente enquanto a página estiver aberta.
  useEffect(() => {
    if (!profile) return;
    pollChallenges(profile.id);
    const interval = setInterval(() => {
      loadFriendsAndPending(profile.id);
      pollChallenges(profile.id);
    }, 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleAddFriend = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!profile || !addFriendInput.trim()) return;

    setAddFriendSubmitting(true);
    try {
      const res = await fetch(`${API_HTTP_BASE}/users/${profile.id}/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: addFriendInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Não foi possível enviar o pedido.");
        return;
      }
      setAddFriendInput("");
      alert("Pedido de amizade enviado!");
    } catch {
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setAddFriendSubmitting(false);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    if (!profile) return;
    await fetch(`${API_HTTP_BASE}/users/${profile.id}/friends/${friendshipId}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    loadFriendsAndPending(profile.id);
  };

  const handleRejectRequest = async (friendshipId: string) => {
    if (!profile) return;
    await fetch(`${API_HTTP_BASE}/users/${profile.id}/friends/${friendshipId}`, { method: "DELETE", headers: authHeaders() });
    loadFriendsAndPending(profile.id);
  };

  const handleChallengeFriend = async (friendId: string) => {
    if (!profile) return;
    const res = await fetch(`${API_HTTP_BASE}/users/${profile.id}/challenges`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: friendId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Não foi possível enviar o desafio.");
      return;
    }
    alert("Desafio enviado! Aguardando o amigo aceitar...");
  };

  const handleAcceptChallenge = async (challenge: ChallengeItem) => {
    if (!profile) return;
    const res = await fetch(`${API_HTTP_BASE}/users/${profile.id}/challenges/${challenge.id}/accept`, {
      method: "POST",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Não foi possível aceitar o desafio.");
      return;
    }
    navigate("/jogar", { state: { matchId: data.matchId, slot: data.slot, arenaId: data.arenaId, seed: data.seed, player1Username: data.player1Username, player2Username: data.player2Username } });
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    if (!profile) return;
    await fetch(`${API_HTTP_BASE}/users/${profile.id}/challenges/${challengeId}`, { method: "DELETE", headers: authHeaders() });
    setIncomingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois
    if (!file || !profile) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      alert("Formato não suportado. Use PNG, JPG, WEBP ou GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      alert("Imagem muito grande (máx. 2MB).");
      return;
    }

    const avatarBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch(`${API_HTTP_BASE}/users/${profile.id}/avatar`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ avatarBase64 }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Não foi possível atualizar o avatar.");
      return;
    }
    setProfile((prev) => (prev ? { ...prev, avatarUrl: data.avatarUrl } : prev));
  };

  const handleToggle2fa = async (enabled: boolean) => {
    if (!profile) return;
    const res = await fetch(`${API_HTTP_BASE}/users/${profile.id}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ twoFactorEnabled: enabled }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Não foi possível atualizar o 2FA.");
      return;
    }
    setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: data.twoFactorEnabled } : prev));
  };

  // Função para deslogar da conta
  const handleLogout = () => {
    localStorage.removeItem("bullet_authenticated");
    localStorage.removeItem("bullet_username");
    localStorage.removeItem("bullet_email");
    localStorage.removeItem("bullet_token");
    localStorage.removeItem("bullet_user_id");
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-57px)] px-4 py-12 select-none">
      {/* Grid Responsivo principal */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* COLUNA DA ESQUERDA: Dados do Perfil, Amigos e Estatísticas */}
        <div className="md:col-span-1 flex flex-col gap-6 w-full">

          {/* Bloco do Usuário e Configurações */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-5 text-center items-center">
            <label className="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer group shadow-lg shadow-purple-600/30 shrink-0">
              {profile?.avatarUrl ? (
                <img src={`${API_HTTP_BASE}${profile.avatarUrl}`} alt={username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-purple-600 flex items-center justify-center text-2xl font-black text-white">
                  {username[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] font-bold uppercase text-white text-center px-1">
                Trocar
              </div>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
            </label>

            <div>
              <h1 className="text-xl font-black tracking-wide text-white uppercase truncate max-w-[180px]">{username}</h1>
              <p className="text-zinc-500 text-xs font-medium truncate max-w-[180px]">{email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 text-xs font-bold uppercase tracking-wider bg-red-950/20 hover:bg-red-950/60 text-red-400 border border-red-900/40 rounded-lg transition-colors cursor-pointer"
            >
              Sair da Conta
            </button>

            <label className="w-full flex items-center justify-between gap-2 text-xs text-zinc-400 font-medium cursor-pointer bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-2 select-none">
              <span className="text-left leading-tight">Autenticação em 2 fatores (2FA)</span>
              <input
                type="checkbox"
                checked={profile?.twoFactorEnabled ?? false}
                onChange={(e) => handleToggle2fa(e.target.checked)}
                className="accent-purple-500 w-4 h-4 rounded cursor-pointer shrink-0"
              />
            </label>
          </div>

          {/* Adicionar amigo — CORREÇÃO ANTI-ESTOURO COM FLEX-WRAP */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-3">
            <h3 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
              Adicionar Amigo
            </h3>
            <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 w-full">
              <input
                type="text"
                value={addFriendInput}
                onChange={(e) => setAddFriendInput(e.target.value)}
                placeholder="Username do jogador"
                className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={addFriendSubmitting}
                className="sm:w-auto md:w-full lg:w-auto px-4 py-2 shrink-0 text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer text-center"
              >
                Adicionar
              </button>
            </form>
          </div>

          {/* Pedidos pendentes */}
          {pendingRequests.length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-3">
              <h3 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                Pedidos Pendentes
              </h3>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl divide-y divide-zinc-900 max-h-[160px] overflow-y-auto pr-1">
                {pendingRequests.map((req) => (
                  <div key={req.friendshipId} className="p-3 flex justify-between items-center text-sm gap-2 flex-wrap sm:flex-nowrap md:flex-wrap lg:flex-nowrap">
                    <span className="text-zinc-300 font-bold truncate max-w-[100px]">{req.requester.username}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(req.friendshipId)}
                        className="px-2 py-1 text-[9px] font-bold uppercase bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-400 border border-emerald-900/40 rounded cursor-pointer"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.friendshipId)}
                        className="px-2 py-1 text-[9px] font-bold uppercase bg-red-950/20 hover:bg-red-950/60 text-red-400 border border-red-900/40 rounded cursor-pointer"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desafios recebidos */}
          {incomingChallenges.length > 0 && (
            <div className="bg-zinc-900/40 border border-purple-800/50 p-5 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-3">
              <h3 className="text-[10px] font-black tracking-widest text-purple-400 uppercase animate-pulse">
                Desafios Recebidos
              </h3>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl divide-y divide-zinc-900 max-h-[160px] overflow-y-auto pr-1">
                {incomingChallenges.map((challenge) => (
                  <div key={challenge.id} className="p-3 flex justify-between items-center text-sm gap-2 flex-wrap sm:flex-nowrap md:flex-wrap lg:flex-nowrap">
                    <span className="text-zinc-300 font-bold truncate max-w-[100px]">{challenge.otherUsername}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAcceptChallenge(challenge)}
                        className="px-2 py-1 text-[9px] font-bold uppercase bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-400 border border-emerald-900/40 rounded cursor-pointer"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleDeclineChallenge(challenge.id)}
                        className="px-2 py-1 text-[9px] font-bold uppercase bg-red-950/20 hover:bg-red-950/60 text-red-400 border border-red-900/40 rounded cursor-pointer"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Amigos */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-3">
            <h3 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
              Lista de Amigos
            </h3>
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl divide-y divide-zinc-900 max-h-[220px] overflow-y-auto pr-1">
              {loading ? (
                <div className="p-3.5 text-sm text-zinc-500">Carregando...</div>
              ) : friends.length === 0 ? (
                <div className="p-3.5 text-sm text-zinc-500">Nenhum amigo ainda.</div>
              ) : (
                friends.map((friend) => (
                  <div key={friend.id} className="p-3 flex justify-between items-center text-sm gap-2">
                    <span className="text-zinc-300 font-bold flex items-center gap-2 truncate max-w-[120px]">
                      <span
                        title={friend.online ? "Online" : "Offline"}
                        className={`w-2 h-2 rounded-full shrink-0 ${friend.online ? "bg-emerald-400" : "bg-zinc-600"}`}
                      />
                      <span className="truncate">{friend.username}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {friend.online && (
                        <button
                          onClick={() => handleChallengeFriend(friend.id)}
                          className="px-2 py-1 text-[9px] font-bold uppercase bg-purple-950/40 hover:bg-purple-900/60 text-purple-400 border border-purple-900/40 rounded cursor-pointer"
                        >
                          Desafiar
                        </button>
                      )}
                      <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 font-medium">
                        {friend.rankingPoints} pts
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DA DIREITA: Estatísticas Grandes, Conquistas e Histórico de Combates */}
        <div className="md:col-span-2 flex flex-col gap-6 w-full">

          {/* Grid de Estatísticas (dados reais via GET /users/:id) */}
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-center shadow-xl backdrop-blur-sm">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Ranking</span>
              <span className="text-xl font-mono font-black text-purple-400 mt-1 block truncate">
                {loading ? "…" : `${profile?.rankingPoints ?? 0} pts`}
              </span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-center shadow-xl backdrop-blur-sm">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Partidas</span>
              <span className="text-xl font-mono font-black text-white mt-1 block">
                {loading ? "…" : profile?.matchesPlayed ?? 0}
              </span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-center shadow-xl backdrop-blur-sm">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Vitórias</span>
              <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">
                {loading ? "…" : profile?.wins ?? 0}
              </span>
            </div>
          </div>

          {/* Conquistas (derivadas de wins, sem tabela própria) */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-4 shrink-0">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3 flex-wrap gap-2">
              <h3 className="font-black text-purple-400 tracking-wider uppercase text-xs">Conquistas</h3>
              {(() => {
                const wins = profile?.wins ?? 0;
                const next = ACHIEVEMENT_THRESHOLDS.find((t) => t > wins);
                return next ? (
                  <span className="text-zinc-600 font-mono text-[10px] uppercase">
                    {wins}/{next} vitórias pra próxima
                  </span>
                ) : null;
              })()}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {ACHIEVEMENT_THRESHOLDS.map((threshold) => {
                const unlocked = (profile?.wins ?? 0) >= threshold;
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

          {/* Histórico de Combates — ADICIONADO CONTROLE DE ALTURA E SCROLL INTELIGENTE */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-4 flex-1 min-h-0">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-black text-purple-400 tracking-wider uppercase text-xs">Histórico Recente de Partidas</h3>
            </div>

            {/* O pulo do gato: flex-1 e overflow-y-auto impedem o histórico de vazar e quebrar o Footer */}
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1 max-h-[340px] md:max-h-[none]">
              {loading ? (
                <div className="text-sm text-zinc-500 py-4">Carregando histórico...</div>
              ) : history.length === 0 ? (
                <div className="text-sm text-zinc-500 py-4">Nenhuma partida registrada até o momento.</div>
              ) : (
                history.map((match) => (
                  <div
                    key={match.id}
                    className={`flex justify-between items-center bg-zinc-950/40 border p-4 rounded-xl transition-all shrink-0 ${match.result === "VITÓRIA"
                        ? "border-emerald-950/50 hover:bg-emerald-950/5"
                        : "border-red-950/50 hover:bg-red-950/5"
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

        </div>

      </div> {/* Fecha a div do Grid Responsivo Principal */}
    </div> /* Fecha a div centralizada inicial */
  );
}
