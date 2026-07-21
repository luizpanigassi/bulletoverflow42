import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


const handleLogin = (e: React.SyntheticEvent) => {
  e.preventDefault();

  if (!email || !password) return alert("Preencha todos os campos!");

  // Resto do codigo do login...
  const mockUsername = email.split("@")[0] || "Soldado";
  
  localStorage.setItem("bullet_username", mockUsername);
  localStorage.setItem("bullet_email", email);
  localStorage.setItem("bullet_authenticated", "true");

  navigate("/");
};


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4 select-none">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-6">
        
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-wider text-purple-400">BULLET OVERFLOW</h1>
          <p className="text-zinc-500 text-xs tracking-wider uppercase mt-1">Acesse sua Conta de Combate</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* E-mail */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-all"
              placeholder="seu-email@escola42.fr"
              required
            />
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Botão de Entrar Local */}
          <button
            type="submit"
            className="w-full py-3 mt-2 font-bold tracking-wider text-white uppercase bg-purple-600 hover:bg-purple-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95"
          >
            Autenticar
          </button>
        </form>

        {/* Divisor Visual */}
        <div className="flex items-center my-1">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="px-3 text-xs text-zinc-600 font-bold uppercase tracking-widest">Ou</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Botão OAuth 42 (Preparado para o fluxo do backend descrito no doc) */}
        <button
          onClick={() => {
            // Em produção, isso redirecionará para GET /auth/42 do backend
            alert("Redirecionando para o OAuth da API 42 (Ambiente em desenvolvimento)...");
          }}
          className="w-full py-3 text-xs font-black tracking-widest text-zinc-300 uppercase bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>🌐</span> Entrar via Intra 42
        </button>

      </div>
    </div>
  );
}
