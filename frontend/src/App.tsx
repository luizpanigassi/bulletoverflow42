import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { Menu } from "./pages/Menu";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MatchmakingPage } from "./pages/MatchmakingPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AiTrainingPage } from "./pages/AiTrainingPage";
import { ChooseUsernamePage } from "./pages/ChooseUsernamePage";
import { Footer } from "./components/Footer";
import { API_HTTP_BASE } from "./config/api";

const HEARTBEAT_INTERVAL_MS = 20_000;

// Componente de proteção simples para garantir que o jogador só acesse as telas se estiver "logado"
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("bullet_authenticated") === "true";

  // Marca presença ("online") pros amigos verem, enquanto o app estiver aberto.
  useEffect(() => {
    if (!isAuthenticated) return;
    const userId = localStorage.getItem("bullet_user_id");
    const token = localStorage.getItem("bullet_token");
    if (!userId || !token) return;

    const sendHeartbeat = () => {
      fetch(`${API_HTTP_BASE}/users/${userId}/heartbeat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { });
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* 1. O PAI: h-screen e flex-col travam o site no tamanho exato do monitor, sem sobrar espaço */}
      <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden selection:bg-purple-500/30">

        {/* Menu Superior Estilizado - Adicionada a classe shrink-0 para não ser esmagada */}
        <nav className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800 tracking-wide select-none shrink-0">
          <div className="flex gap-6 items-center">
            <Link to="/" className="text-white hover:text-purple-400 font-black tracking-wider text-sm transition-colors uppercase">
              🎮 Bullet Overflow
            </Link>
            <Link to="/leaderboard" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider">
              Ranking
            </Link>
            <Link to="/jogar" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider">
              Jogar
            </Link>
          </div>

          <div>
            <Link
              to="/perfil"
              className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider flex items-center gap-1 shrink-0"
            >
              <span>👤</span>
              <span className="hidden sm:inline">Perfil</span>
            </Link>

          </div>
        </nav>

        {/* 2. CORREÇÃO CENTRAL: flex-1 faz o conteúdo esticar preenchendo o espaço vazio. 
            overflow-y-auto adiciona scroll interno se a página (como o ranking) for gigante, mantendo o footer visível */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 text-white font-sans antialiased selection:bg-purple-500/30">
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Rotas Protegidas (Exigem Login prévio) */}
            <Route path="/" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
            <Route path="/jogar" element={<ProtectedRoute><MatchmakingPage /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/treino-ia" element={<ProtectedRoute><AiTrainingPage /></ProtectedRoute>} />
            <Route path="/escolher-username" element={<ProtectedRoute><ChooseUsernamePage /></ProtectedRoute>} />
          </Routes>
        </main>

        {/* 3. O RODAPÉ: Agora ele se encaixa na base porque o meio respeita o limite do Flexbox */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}
