interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl text-left">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
          <h2 className="text-md font-black tracking-wider text-purple-400 uppercase">Política de Privacidade</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer p-1">✕ Fechar</button>
        </div>
        
        {/* Conteúdo com scroll */}
        <div className="p-6 overflow-y-auto text-sm text-zinc-300 flex flex-col gap-4 font-normal leading-relaxed selection:bg-purple-500/20">
          <h1 className="text-xl font-black text-white border-b border-zinc-800/50 pb-2">Política de Privacidade — Bullet Overflow</h1>
          <p className="text-xs text-zinc-500 italic">Última atualização: 14/07/2026</p>

          <h3 className="font-bold text-white text-base mt-2">1. Sobre este documento</h3>
          <p>O Bullet Overflow é um projeto acadêmico desenvolvido como parte do currículo da 42 (projeto ft_transcendence). Esta Política de Privacidade explica quais dados coletamos de você ao usar o jogo, por que coletamos, como usamos e quais direitos você tem sobre eles.</p>
          <p>Ao criar uma conta ou usar o Bullet Overflow, você concorda com as práticas descritas aqui.</p>

          <h3 className="font-bold text-white text-base mt-2">2. Quem somos</h3>
          <p>O Bullet Overflow é mantido por uma equipe de estudantes da 42 no contexto de um projeto educacional. Não somos uma empresa comercial — não vendemos produtos, não exibimos anúncios e não monetizamos dados de usuários.</p>
          <p className="text-zinc-400">Contato: luinasci@student.42sp.org.br, jcologne@student.42sp.org.br, tguilher@student.42sp.org.br, lilmende@student.42sp.org.br</p>

          <h3 className="font-bold text-white text-base mt-2">3. Quais dados coletamos</h3>
          <p>Coletamos apenas o necessário para o funcionamento do jogo:</p>
          <ul className="list-disc pl-5 flex flex-col gap-2 text-zinc-400">
            <li><strong>Dados de conta:</strong> nome de usuário e e-mail, obrigatórios no cadastro.</li>
            <li><strong>Senha:</strong> armazenada apenas na forma de hash (com salt) — nunca em texto puro. Nós mesmos não temos acesso à sua senha original.</li>
            <li><strong>Login via 42 (OAuth):</strong> se você optar por entrar com sua conta da 42, recebemos seu identificador da 42 para vincular à sua conta no Bullet Overflow. Não temos acesso à sua senha da 42.</li>
            <li><strong>Avatar:</strong> se você enviar uma imagem de perfil, ela é armazenada e associada à sua conta. Um avatar padrão é usado caso você não envie um.</li>
            <li><strong>Dados de amizade:</strong> solicitações de amizade enviadas/recebidas e lista de amigos.</li>
            <li><strong>Dados de partidas:</strong> histórico de partidas (adversário, placar, resultado, arena, data) e pontuação de ranking, usados para o leaderboard e histórico do jogador.</li>
            <li><strong>Dados de sessão de jogo em tempo real:</strong> durante uma partida, posição, ações e input são trocados entre os dois jogadores (via nosso servidor, que apenas repassa essas mensagens) para sincronizar a partida. Esses dados de movimentação/input não são armazenados permanentemente — só o resultado final da partida é salvo.</li>
          </ul>
          <p>Não coletamos dados de pagamento (o jogo é gratuito e não processa transações) e não usamos rastreadores de terceiros ou serviços de publicidade.</p>

          <h3 className="font-bold text-white text-base mt-2">4. Como usamos seus dados</h3>
          <p>Usamos os dados coletados exclusivamente para:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-zinc-400">
            <li>Autenticar você e manter sua conta segura.</li>
            <li>Formar partidas (matchmaking) e sincronizar o jogo entre os dois jogadores.</li>
            <li>Manter seu histórico de partidas, estatísticas e posição no leaderboard.</li>
            <li>Viabilizar o sistema de amigos (busca, solicitações, lista de amigos).</li>
            <li>Exibir seu nome de usuário e avatar para outros jogadores durante partidas e no seu perfil.</li>
          </ul>
          <p>Não usamos seus dados para fins de marketing, publicidade direcionada ou venda a terceiros.</p>

          <h3 className="font-bold text-white text-base mt-2">5. Cookies e armazenamento local</h3>
          <p>Usamos cookies/armazenamento local estritamente necessários para manter sua sessão autenticada (por exemplo, o token que comprova que você está logado). Não usamos cookies de rastreamento ou de terceiros para publicidade.</p>

          <h3 className="font-bold text-white text-base mt-2">6. Compartilhamento de dados</h3>
          <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. As únicas exceções são:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-zinc-400">
            <li><strong>42 (Intra):</strong> se você usar login via OAuth 42, há uma troca de dados de autenticação com a API da 42, conforme o protocolo padrão de OAuth 2.0.</li>
            <li><strong>Obrigação legal:</strong> se exigido por lei ou ordem judicial.</li>
          </ul>
          <p>Seus dados de partida (placar, resultado) são visíveis publicamente no leaderboard e no seu histórico de partidas, já que essa é uma funcionalidade central do jogo.</p>

          <h3 className="font-bold text-white text-base mt-2">7. Segurança</h3>
          <p>Senhas são armazenadas com hash e salt, nunca em texto puro. A comunicação com o servidor é feita via HTTPS. Tomamos medidas razoáveis para proteger seus dados, mas, como todo projeto acadêmico em desenvolvimento, não garantimos segurança absoluta — recomendamos não reutilizar senhas de outros serviços.</p>

          <h3 className="font-bold text-white text-base mt-2">8. Retenção de dados</h3>
          <p>Mantemos seus dados de conta enquanto ela estiver activa. Se você solicitar a exclusão da sua conta, removemos seus dados pessoais identificáveis (e-mail, senha, avatar), podendo manter registros de partidas de forma anonimizada para preservar a integridade do leaderboard/historico de outros jogadores.</p>

          <h3 className="font-bold text-white text-base mt-2">9. Seus direitos</h3>
          <p>Você pode, a qualquer momento, solicitar:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-zinc-400">
            <li>Acesso aos dados que temos sobre você.</li>
            <li>Correção de dados incorretos.</li>
            <li>Exclusão da sua conta e dos dados pessoais associados.</li>
          </ul>
          <p>Para exercer esses direitos, entre em contato pelo e-mail informado na seção 2.</p>

          <h3 className="font-bold text-white text-base mt-2">10. Menores de idade</h3>
          <p>O Bullet Overflow não é direcionado a menores de 13 anos. Se você tem entre 13 e 18 anos, recomendamos o uso com supervisão de um responsável.</p>

          <h3 className="font-bold text-white text-base mt-2">11. Alterações nesta política</h3>
          <p>Esta política pode ser atualizada conforme o projeto evolui. Mudanças relevantes serão comunicadas na própria aplicação.</p>

          <h3 className="font-bold text-white text-base mt-2">12. Contato</h3>
          <p className="text-zinc-400">Dúvidas sobre esta Política de Privacidade podem ser enviadas para luinasci@student.42sp.org.br, jcologne@student.42sp.org.br, tguilher@student.42sp.org.br ou lilmende@student.42sp.org.br.</p>
        </div>
        
        {/* Rodapé */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 text-right">
          <button onClick={onClose} className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-500 cursor-pointer">Entendi</button>
        </div>
        
      </div>
    </div>
  );
}
