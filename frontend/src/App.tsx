import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Menu } from "./pages/Menu";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MatchmakingPage } from "./pages/MatchmakingPage";

export default function App() {
  return (
    <BrowserRouter>
      {/* Menu Superior Estilizado com Tailwind */}
      <nav className="flex gap-6 p-4 bg-zinc-900 border-b border-zinc-800 tracking-wide">
        <Link to="/" className="text-white hover:text-purple-400 font-bold transition-colors">
          🎮 Bullet Overflow
        </Link>
        <Link to="/leaderboard" className="text-zinc-400 hover:text-white transition-colors">
          Ranking
        </Link>
        <Link to="/jogar" className="text-zinc-400 hover:text-white transition-colors">
          Jogar
        </Link>
      </nav>

      {/* Container Principal */}
      <main className="bg-zinc-950 text-white min-h-[calc(100vh-57px)] font-sans antialiased selection:bg-purple-500/30">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/jogar" element={<MatchmakingPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
