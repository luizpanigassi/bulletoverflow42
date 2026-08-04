import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GodotCanvas } from "../components/GodotCanvas";
import { API_WS_BASE } from "../config/api";

interface MatchData {
  matchId: string;
  slot: number;
  serverUrl: string;
  arenaId: string;
  seed: number;
}

export function MatchmakingPage() {
  const navigate = useNavigate();
  
  // 1. Estados para gerenciar as fases: Buscando Partida ou Jogando
  const [inQueue, setInQueue] = useState(true);
  const [matchData, setMatchData] = useState<MatchData | null>(null);

  // Recupera o nome de usuário do localStorage que salvamos na tela de Menu
  const username = localStorage.getItem("bullet_username") || "Soldado_Anonimo";

  // 2. Loop de Conexão com o WebSocket do Matchmaking
  useEffect(() => {
    if (!inQueue) return;

    // Conecta na rota WebSocket de matchmaking descrita no arquivo do backend
    const socketUrl = `${API_WS_BASE}/matchmaking/queue?userId=${encodeURIComponent(username)}`;
    const ws = new WebSocket(socketUrl);

    ws.onopen = () => {
      console.log("[React] Conectado à fila de matchmaking do Fastify");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Quando o servidor encontrar um par, ele envia "match_found"
        if (data.type === "match_found") {
          console.log("[React] Partida Encontrada!", data);

          const gameplaySocketUrl = `${API_WS_BASE}/matches/${data.match_id}?slot=${data.slot}`;
          
          // Armazena todos os dados oficiais vindo do Fastify
          setMatchData({
            matchId: data.match_id,
            slot: data.slot,
            serverUrl: gameplaySocketUrl, // URL ws:// dedicada do gameplay via proxy atual
            arenaId: data.arena_id,        // Arena sorteada pelo backend
            seed: data.seed,              // Semente idêntica do mapa
          });
          
          setInQueue(false); // Sai do estado de busca da fila
        }
      } catch (err) {
        console.error("Erro ao ler resposta da fila:", err);
      }
    };

    ws.onclose = () => {
      console.log("[React] Conexão com a fila encerrada");
    };

    // Função de limpeza do React: Se o jogador clicar em voltar ou fechar a aba,
    // o socket fecha e o backend o remove da fila automaticamente no socket.on("close") do Fastify
    return () => {
      ws.close();
    };
  }, [inQueue, username]);

  // --- RENDERIZAÇÃO DAS TELAS ---

  // CASO A: Partida Encontrada -> Renderiza a Arena do Jogo (O Canvas da Godot)
  if (matchData) {
    return (
      <div className="flex flex-col items-center justify-start min-h-[calc(100vh-57px)] px-4 py-8 select-none">
        <div className="w-full max-w-5xl flex flex-col gap-4">
          
          {/* Painel do Topo com os Dados do Jogo Sincronizados */}
          <div className="flex flex-wrap justify-between items-center bg-zinc-900/80 border border-zinc-800 px-6 py-4 rounded-xl text-sm font-semibold tracking-wide">
            <div className="flex gap-6 items-center">
              <div>
                <span className="text-zinc-500 uppercase text-xs block">Status</span>
                <span className="text-emerald-400 font-bold uppercase animate-pulse">Em Combate</span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <span className="text-zinc-500 uppercase text-xs block">Sua Posição</span>
                <span className="text-purple-400 font-bold">Jogador {matchData.slot}</span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <span className="text-zinc-500 uppercase text-xs block">Arena Ativa</span>
                <span className="text-white font-bold">{matchData.arenaId}</span>
              </div>
            </div>
            
            {/* Botão de desistência rápida */}
            <button
              onClick={() => {
                setMatchData(null);
                setInQueue(true); // Volta para a busca
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg transition-all cursor-pointer active:scale-95"
            >
              Abandonar Sala
            </button>
          </div>

          {/* Componente GodotCanvas entra exatamente aqui */}
          <GodotCanvas 
            matchId={matchData.matchId}
            slot={matchData.slot}
            serverUrl={matchData.serverUrl}
            arenaId={matchData.arenaId}
            seed={matchData.seed}
          />

        </div>
      </div>
    );
  }

  // CASO B: Aguardando Oponente -> Tela de Fila de Matchmaking animada
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4 select-none">
      <div className="w-full max-w-md bg-zinc-900/30 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm text-center flex flex-col items-center gap-6">
        
        {/* Ícone de Carregamento Animado com Tailwind */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute w-full h-full border-4 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute w-10 h-10 border-4 border-dashed border-purple-500/20 border-b-fuchsia-500 rounded-full animate-spin [animation-duration:2s] [animation-direction:reverse]" />
        </div>

        {/* Textos Informativos */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black tracking-widest text-purple-400 uppercase animate-pulse">
            Rastreando Oponente...
          </h2>
          <p className="text-zinc-400 text-sm font-medium">
            Soldado conectado: <span className="text-white font-bold">{username}</span>
          </p>
          <p className="text-zinc-600 text-xs px-4">
            Aguardando o servidor Fastify encontrar outro jogador disponível na fila FIFO...
          </p>
        </div>

        {/* Botão Cancelar */}
        <button
          onClick={() => navigate("/")}
          className="w-full mt-2 py-3 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
        >
          Cancelar e Voltar ao Menu
        </button>

      </div>
    </div>
  );
}
