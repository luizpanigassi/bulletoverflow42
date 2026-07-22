import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TermsModal } from "../components/TermsModal";
import { PrivacyModal } from "../components/PrivacyModal";

export function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Controla apenas se o modal está visível (true) ou oculto (false)
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleAuthSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!email || !password) return alert("Preencha todos os campos!");
    
    if (isRegister && !acceptedTerms) {
      return alert("Você precisa aceitar os Termos de Serviço e a Política de Privacidade para prosseguir.");
    }

    const mockUsername = email.split("@")[0] || "Soldado";
    
    localStorage.setItem("bullet_username", mockUsername);
    localStorage.setItem("bullet_email", email);
    localStorage.setItem("bullet_authenticated", "true");

    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4 select-none relative">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-6">
        
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">
            BULLET OVERFLOW
          </h1>
          <p className="text-zinc-500 text-xs tracking-wider uppercase mt-1">
            {isRegister ? "Criar Nova Identidade de Combate" : "Acesse sua Conta de Combate"}
          </p>
        </div>

        <div className="flex border-b border-zinc-800 text-sm font-bold">
          <button 
            type="button"
            onClick={() => { setIsRegister(false); setAcceptedTerms(false); }}
            className={`flex-1 pb-3 text-center transition-colors cursor-pointer ${!isRegister ? "text-purple-400 border-b-2 border-purple-500" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Entrar
          </button>
          <button 
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 pb-3 text-center transition-colors cursor-pointer ${isRegister ? "text-purple-400 border-b-2 border-purple-500" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
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

          {isRegister && (
            <div className="flex items-start gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80 my-1 text-left">
              <input
                type="checkbox"
                id="privacy-terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 accent-purple-500 w-4 h-4 rounded cursor-pointer"
                required
              />
              <label htmlFor="privacy-terms" className="text-xs text-zinc-400 leading-relaxed font-medium">
                Li e concordo com os{" "}
                <button 
                  type="button" 
                  onClick={() => setShowTermsModal(true)}
                  className="text-purple-400 font-bold hover:underline cursor-pointer"
                >
                  Termos de Serviço
                </button>{" "}
                e com a{" "}
                <button 
                  type="button" 
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-purple-400 font-bold hover:underline cursor-pointer"
                >
                  Política de Privacidade
                </button>{" "}
                do projeto acadêmico.
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 mt-2 font-bold tracking-wider text-white uppercase bg-purple-600 hover:bg-purple-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95"
          >
            {isRegister ? "Finalizar Cadastro" : "Autenticar"}
          </button>
        </form>

        <div className="flex items-center my-1">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="px-3 text-xs text-zinc-600 font-bold uppercase tracking-widest">Ou</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <button
          onClick={() => alert("Redirecionando para o OAuth da API 42...")}
          className="w-full py-3 text-xs font-black tracking-widest text-zinc-300 uppercase bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>🌐</span> Entrar via Intra 42
        </button>

      </div>

      {/* RENDERIZAÇÃO DOS COMPONENTES ISOLADOS */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

    </div>
  );
}
