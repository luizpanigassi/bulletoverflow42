interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl text-left">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
          <h2 className="text-md font-black tracking-wider text-purple-400 uppercase">Termos de Serviço</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer p-1">✕ Fechar</button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-zinc-300 flex flex-col gap-4 font-normal leading-relaxed selection:bg-purple-500/20">
          <p className="text-xs text-zinc-500 italic">Última atualização: 14/07/2026</p>
          
          <h3 className="font-bold text-white text-base mt-2">1. Aceitação dos termos</h3>
          <p>Ao criar uma conta ou usar o Bullet Overflow, você concorda com estes Termos de Serviço. Se você não concorda, não deve usar o jogo. O Bullet Overflow é um projeto acadêmico desenvolvido por estudantes da 42 como parte do projeto ft_transcendence, com fins educacionais. Não é um produto comercial.</p>
          
          <h3 className="font-bold text-white text-base mt-2">2. Descrição do serviço</h3>
          <p>O Bullet Overflow é um jogo multiplayer online (arena de combate 1x1 em tempo real), com sistema de contas, matchmaking, ranking, histórico de partidas e amigos. O jogo é oferecido gratuitamente.</p>
          
          <h3 className="font-bold text-white text-base mt-2">3. Elegibilidade</h3>
          <p>Para criar uma conta, você deve ter no mínimo 13 anos. Ao se cadastrar, você declara que as informações fornecidas (nome de usuário, e-mail) são verdadeiras.</p>
          
          <h3 className="font-bold text-white text-base mt-2">4. Conta de usuário</h3>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-zinc-400">
            <li>Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na sua conta.</li>
            <li>Você deve nos notificar imediatamente sobre qualquer uso não autorizado da sua conta.</li>
            <li>Cada pessoa pode manter apenas uma conta. Contas duplicadas para burlar ranking ou matchmaking podem ser suspensas.</li>
          </ul>

          <h3 className="font-bold text-white text-base mt-2">5. Conduta do usuário</h3>
          <p>Ao usar o Bullet Overflow, você concorda em <strong>não</strong>: utilizar bots/cheats, explorar bugs de forma intencional, assediar ou ameaçar outros jogadores, tentar invadir contas ou usar o serviço para finalidades ilegais. Reservamo-nos o direito de suspender ou encerrar contas que violem estas regras.</p>
          
          <h3 className="font-bold text-white text-base mt-2">6. Propriedade intelectual</h3>
          <p>O código-fonte, arte, personagens, arenas e demais conteúdos originais pertencem à equipe desenvolvedora do projeto. Ativos de terceiros mantêm suas respectivas licenças originais.</p>
          
          <h3 className="font-bold text-white text-base mt-2">7. Natureza acadêmica do projeto</h3>
          <p>Por ser um projeto educacional em desenvolvimento contínuo, o Bullet Overflow pode passar por instabilidades, ter dados de contas/partidas reiniciados durante o desenvolvimento ou ser descontinuado ao final do ciclo de avaliação acadêmica.</p>
          
          <h3 className="font-bold text-white text-base mt-2">8. Isenção de garantias e limitação de responsabilidade</h3>
          <p>O jogo é fornecido "como está", sem garantias de qualquer tipo. Não nos responsabilizamos por perdas de dados ou quaisquer danos decorrentes do uso do jogo.</p>
          
          <h3 className="font-bold text-white text-base mt-2">12. Contato</h3>
          <p className="text-zinc-400">Dúvidas podem ser enviadas para os desenvolvedores: luinasci@student.42sp.org.br, jcologne@student.42sp.org.br, tguilher@student.42sp.org.br ou lilmende@student.42sp.org.br.</p>
        </div>
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 text-right">
          <button onClick={onClose} className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-500 cursor-pointer">Entendi</button>
        </div>
      </div>
    </div>
  );
}
