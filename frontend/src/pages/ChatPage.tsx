import { useState, useRef, useEffect } from "react";
import { useChatMock } from "../hooks/useChatMock";

export function ChatPage() {
  const [activeTab, setActiveTab] = useState<"global" | "trade" | "dm">("global");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // CONEXÃO COM O CÉREBRO: Puxa todas as funções e estados de forma limpa!
  const { users, filteredMessages, sendMessage, toggleBlockUser } = useChatMock(activeTab, selectedUser);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4 py-6 select-none h-[calc(100vh-140px)]">
      
      {/* MENU LATERAL DA ESQUERDA (Canais e Usuários) */}
      <div className="md:col-span-1 flex flex-col gap-4 bg-zinc-900/20 border border-zinc-800/60 p-4 rounded-2xl backdrop-blur-sm shadow-xl h-full overflow-y-auto">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Canais</span>
        <button onClick={() => { setActiveTab("global"); setSelectedUser(null); }} className={`w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl text-left cursor-pointer ${activeTab === "global" ? "bg-purple-600 text-white shadow-lg" : "text-zinc-400 hover:bg-zinc-800/40"}`}>🌐 Chat Global</button>
        <button onClick={() => { setActiveTab("trade"); setSelectedUser(null); }} className={`w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl text-left cursor-pointer ${activeTab === "trade" ? "bg-purple-600 text-white shadow-lg" : "text-zinc-400 hover:bg-zinc-800/40"}`}>💰 Negociações</button>
        
        <div className="w-full h-px bg-zinc-800/60 my-2" />
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Mensagens Diretas</span>
        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
          {users.map((u) => (
            <div key={u.username} onClick={() => { setActiveTab("dm"); setSelectedUser(u.username); }} className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-all text-left cursor-pointer flex items-center justify-between ${selectedUser === u.username && activeTab === "dm" ? "bg-zinc-800 text-purple-400 border border-purple-500/30" : "text-zinc-400 hover:bg-zinc-800/30"}`}>
              <span className={`truncate flex items-center gap-2 ${u.isBlocked ? "line-through text-red-500/70" : ""}`}><span className={`w-2 h-2 rounded-full ${u.online ? "bg-emerald-400" : "bg-zinc-600"}`} />{u.username}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); toggleBlockUser(u.username); }} className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${u.isBlocked ? "bg-red-950/40 text-red-400 border border-red-900/30" : "bg-zinc-900 text-zinc-500 hover:text-red-400"}`}>{u.isBlocked ? "Desbloquear" : "Bloquear"}</button>
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA CENTRAL DO CHAT (Mensagens e Input) */}
      <div className="md:col-span-3 flex flex-col bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl h-full">
        <div className="border-b border-zinc-800 pb-3 mb-4 flex justify-between items-center px-2 shrink-0">
          <h3 className="font-black text-purple-400 tracking-wider uppercase text-xs">
            {activeTab === "global" ? "Sala Pública Global" : activeTab === "trade" ? "Mercado de Skins & Desafios" : `Conversa Privada com ${selectedUser}`}
          </h3>
        </div>

        {/* Lista de Mensagens Balão */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 mb-4">
          {activeTab === "dm" && !selectedUser ? (
            <div className="text-zinc-500 text-xs text-center my-auto uppercase font-bold tracking-wider">Seleccione um soldado lateral para iniciar transmissão</div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-zinc-600 text-xs text-center my-auto uppercase tracking-wide">Nenhuma mensagem por aqui...</div>
          ) : (
            filteredMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col max-w-[75%] gap-1 ${msg.isMe ? "self-end items-end" : "self-start items-start"}`}>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">{msg.sender} • <span className="font-mono font-medium">{msg.timestamp}</span></div>
                <div className={`px-4 py-2 rounded-2xl text-sm border ${msg.isMe ? "bg-purple-600 border-purple-500 text-white rounded-tr-none" : "bg-zinc-950 border-zinc-800 text-zinc-200 rounded-tl-none"}`}>{msg.text}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Caixa de Texto e Botão de Enviar */}
        <form onSubmit={handleSubmit} className="flex gap-2 shrink-0 mt-auto">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={activeTab === "dm" && !selectedUser} placeholder={activeTab === "dm" && !selectedUser ? "Selecione um destinatário..." : "Digite sua mensagem de combate..."} className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-colors disabled:opacity-40" />
          <button type="submit" disabled={!inputText.trim() || (activeTab === "dm" && !selectedUser)} className="px-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">Enviar</button>
        </form>

      </div>
    </div>
  );
}
