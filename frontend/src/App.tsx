import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { Menu } from "./pages/Menu";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MatchmakingPage } from "./pages/MatchmakingPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";

// Componente de proteção simples para garantir que o jogador só acesse as telas se estiver "logado"
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("bullet_authenticated") === "true";
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Menu Superior Estilizado */}
      <nav className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800 tracking-wide select-none">
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
          <Link to="/perfil" className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider">
            👤 Perfil
          </Link>
        </div>
      </nav>

      {/* Container Principal */}
      <main className="bg-zinc-950 text-white min-h-[calc(100vh-57px)] font-sans antialiased selection:bg-purple-500/30">
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Rotas Protegidas (Exigem Login prévio) */}
          <Route path="/" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
          <Route path="/jogar" element={<ProtectedRoute><MatchmakingPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
