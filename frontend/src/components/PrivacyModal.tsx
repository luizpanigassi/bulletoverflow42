interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl text-left">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
          <h2 className="text-md font-black tracking-wider text-purple-400 uppercase">Política de Privacidade</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer p-1">✕ Fechar</button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-zinc-300 flex flex-col gap-4 font-normal leading-relaxed selection:bg-purple-500/20">
          <p className="text-xs text-zinc-500 italic">Última atualização: 14/07/2026</p>
          
          <h3 className="font-bold text-white text-base mt-2">1. Sobre este documento</h3>
          <p>O Bullet Overflow é um projeto acadêmico desenvolvido como parte do currículo da 42 (projeto ft_transcendence). Esta Política de Privacidade explica quais dados coletamos de você ao usar o jogo, por que coletamos, como usamos e quais direitos você tem sobre eles.</p>
          
          <h3 className="font-bold text-white text-base mt-2">2. Quem somos</h3>
          <p>O projeto é mantido por uma equipe de estudantes da 42. Não somos uma empresa comercial — não vendemos produtos, não exibimos anúncios e não monetizamos dados de usuários.</p>
          
          <h3 className="font-bold text-white text-base mt-2">3. Quais dados coletamos</h3>
          <p>Coletamos apenas o estritamente necessário para o funcionamento das mecânicas:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-zinc-400">
            <li><strong>Dados de conta:</strong> nome de usuário e e-mail no cadastro.</li>
            <li><strong>Senha:</strong> armazenada em hash com salt (nunca em texto puro).</li>
            <li><strong>Login via 42 (OAuth):</strong> recebemos seu identificador para vincular a conta, sem acesso à sua senha original da Intra.</li>
            <li><strong>Dados de partidas:</strong> histórico de adversários, placares e ranking para compor o leaderboard.</li>
            <li><strong>Sessão em tempo real:</strong> as posições e inputs compartilhados durante a partida via WebSocket não são armazenados permanentemente, apenas repassados.</li>
          </ul>

          <h3 className="font-bold text-white text-base mt-2">5. Cookies e armazenamento local</h3>
          <p>Usamos cookies/armazenamento local estritamente necessários para manter sua sessão autenticada. Não usamos cookies de rastreamento ou de terceiros para fins publicitários.</p>

          <h3 className="font-bold text-white text-base mt-2">7. Segurança</h3>
          <p>A comunicação com o servidor é feita via HTTPS. Tomamos medidas para proteger seus dados, mas por ser um projeto acadêmico, recomendamos fortemente não reutilizar senhas críticas de outros serviços.</p>

          <h3 className="font-bold text-white text-base mt-2">8. Retenção e Direitos</h3>
          <p>Mantemos seus dados enquanto a conta estiver ativa. Você pode solicitar a exclusão da sua conta, remoção dos dados pessoalmente identificáveis ou correção de dados incorretos a qualquer momento contatando o time de desenvolvimento.</p>
        </div>
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 text-right">
          <button onClick={onClose} className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-500 cursor-pointer">Entendi</button>
        </div>
      </div>
    </div>
  );
}
