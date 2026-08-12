import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_HTTP_BASE } from "../config/api";

export function ChooseUsernamePage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userId = localStorage.getItem("bullet_user_id");
  const token = localStorage.getItem("bullet_token");
  const currentUsername = localStorage.getItem("bullet_username") || "";

  const finishAndGo = () => navigate("/");

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!userId || !token || !username.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_HTTP_BASE}/users/${userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Não foi possível salvar esse nome.");
        return;
      }
      localStorage.setItem("bullet_username", data.username);
      finishAndGo();
    } catch {
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-4 select-none">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">
            ESCOLHA SEU NOME DE GUERRA
          </h1>
          <p className="text-zinc-500 text-xs tracking-wider uppercase mt-1">
            É assim que os outros jogadores vão te ver
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Nome de usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-all"
              placeholder={currentUsername || "seu_nome_aqui"}
              maxLength={24}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-2 font-bold tracking-wider text-white uppercase bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95"
          >
            {submitting ? "Salvando..." : "Confirmar"}
          </button>

          <button
            type="button"
            onClick={finishAndGo}
            className="text-xs text-zinc-500 hover:text-zinc-300 font-medium cursor-pointer"
          >
            Manter "{currentUsername}" por agora
          </button>
        </form>
      </div>
    </div>
  );
}