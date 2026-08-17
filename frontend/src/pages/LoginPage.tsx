import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PasswordInput } from "../components/PasswordInput";
import { TermsModal } from "../components/TermsModal";
import { PrivacyModal } from "../components/PrivacyModal";
import { API_HTTP_BASE } from "../config/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Preenchido quando o login pede o código de 2FA; controla a tela do código.
  const [pending2fa, setPending2fa] = useState<{ userId: string } | null>(null);
  const [code, setCode] = useState("");

  // Controla apenas se o modal está visível (true) ou oculto (false)
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  function completeLogin(data: { token: string; user: { id: string; username: string; email: string } }, redirectTo: string = "/") {
    localStorage.setItem("bullet_token", data.token);
    localStorage.setItem("bullet_user_id", data.user.id);
    localStorage.setItem("bullet_username", data.user.username);
    localStorage.setItem("bullet_email", data.user.email);
    localStorage.setItem("bullet_authenticated", "true");
    navigate(redirectTo);
  }

  // Volta do redirect de /auth/42/callback com os dados na query string.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("oauth_token");
    const userId = params.get("oauth_user_id");
    const username = params.get("oauth_username");
    const email = params.get("oauth_email");
    const isNewUser = params.get("oauth_new_user") === "true";
    if (token && userId && username && email) {
      completeLogin({ token, user: { id: userId, username, email } }, isNewUser ? "/escolher-username" : "/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!email || !password) return alert("Preencha todos os campos!");

    if (isRegister && !acceptedTerms) {
      return alert("Você precisa aceitar os Termos de Serviço e a Política de Privacidade para prosseguir.");
    }

    setSubmitting(true);
    try {
      const path = isRegister ? "/auth/signup" : "/auth/login";
      const body = isRegister
        ? { username: email.split("@")[0] || "Soldado", email, password }
        : { email, password };

      const res = await fetch(`${API_HTTP_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        return alert(data.error || "Falha ao autenticar.");
      }

      if (data.requires2fa) {
        setPending2fa({ userId: data.userId });
        return;
      }

      completeLogin(data, isRegister ? "/escolher-username" : "/");
    } catch {
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify2fa = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!pending2fa || !code) return alert("Digite o código recebido por email.");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_HTTP_BASE}/auth/login/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pending2fa.userId, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        return alert(data.error || "Código inválido.");
      }

      completeLogin(data);
    } catch {
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4 select-none relative">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-6">

        {pending2fa ? (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">
                BULLET OVERFLOW
              </h1>
              <p className="text-zinc-500 text-xs tracking-wider uppercase mt-1">
                Digite o código enviado pro seu email
              </p>
            </div>

            <form onSubmit={handleVerify2fa} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Código de 6 dígitos</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm tracking-[0.3em] text-center focus:outline-none transition-all"
                  placeholder="000000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 mt-2 font-bold tracking-wider text-white uppercase bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95"
              >
                {submitting ? "Verificando..." : "Confirmar código"}
              </button>

              <button
                type="button"
                onClick={() => { setPending2fa(null); setCode(""); }}
                className="text-xs text-zinc-500 hover:text-zinc-300 font-medium cursor-pointer"
              >
                Voltar
              </button>
            </form>
          </>
        ) : (
          <>
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
                <PasswordInput
                  value={password}
                  onChange={setPassword}
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
                disabled={submitting}
                className="w-full py-3 mt-2 font-bold tracking-wider text-white uppercase bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95"
              >
                {submitting ? "Aguarde..." : isRegister ? "Finalizar Cadastro" : "Autenticar"}
              </button>
            </form>

            <div className="flex items-center my-1">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="px-3 text-xs text-zinc-600 font-bold uppercase tracking-widest">Ou</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <button
              onClick={() => { window.location.href = `${API_HTTP_BASE}/auth/42`; }}
              className="w-full py-3 text-xs font-black tracking-widest text-zinc-300 uppercase bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🌐</span> Entrar via Intra 42
            </button>
          </>
        )}

      </div>

      {/* RENDERIZAÇÃO DOS COMPONENTES ISOLADOS */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

    </div>
  );
}
