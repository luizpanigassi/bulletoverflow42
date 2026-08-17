import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-full px-4 select-none animate-fade-in text-center">
            <div className="w-full max-w-md bg-zinc-900/30 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm flex flex-col items-center gap-6">
                {/* Bloco do Título com Brilho Neon Vermelho Pulsante */}
                <div className="flex flex-col gap-0.5 select-none">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 font-mono">
                        Sinal Interrompido
                    </span>
                    <h1 className="text-4xl font-extrabold font-mono text-red-500 tracking-wider animate-pulse style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.7)) drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))' }}">
                        ERROR 404
                    </h1>
                </div>
                {/* Código do Erro Gamer */}
                <div className="relative w-32 h-32 bg-zinc-950 border-2 border-red-900/40 rounded-2xl overflow-hidden shadow-lg shadow-red-900/10 shrink-0">
                    <img
                        src="/error-404.png"
                        alt="Conexão Perdida"
                        className="w-full h-full object-cover"
                        style={{ imageRendering: "pixelated" }}
                    />
                </div>

                {/* Textos Informativos */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-black tracking-widest text-purple-400 uppercase">
                        Fora da Zona de Combate
                    </h2>
                    <p className="text-zinc-400 text-sm font-medium px-2">
                        A rota que você tentou acessar não existe ou o sinal com a central foi corrompido.
                    </p>
                    <span className="text-zinc-600 font-mono text-[10px] uppercase mt-2 tracking-wider">
                        Error: Code_Desconectado
                    </span>
                </div>

                {/* Botão de Retorno Seguro */}
                <button
                    onClick={() => navigate("/")}
                    className="w-full mt-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-[0.99] font-black rounded-xl text-xs uppercase tracking-widest text-white transition-all cursor-pointer shadow-lg shadow-purple-900/20"
                >
                    🛰️ Retornar à Base (Menu)
                </button>

            </div>
        </div>
    );
}
