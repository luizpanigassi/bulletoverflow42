interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl text-left">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
          <h2 className="text-md font-black tracking-wider text-purple-400 uppercase">Termos de Serviço</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white font-bold text-sm cursor-pointer p-1">✕ Fechar</button>
        </div>
        
        {/* Conteúdo com scroll */}
        <div className="p-6 overflow-y-auto text-sm text-zinc-300 flex flex-col gap-4 font-normal leading-relaxed selection:bg-purple-500/20">
          <h1 className="text-xl font-black text-white border-b border-zinc-800/50 pb-2">Termos de Serviço — Bullet Overflow</h1>
          <p className="text-xs text-zinc-500 italic">Última atualização: 14/07/2026</p>

          <h3 className="font-bold text-white text-base mt-2">1. Aceitação dos termos</h3>
          <p>Ao criar uma conta ou usar o Bullet Overflow, você concorda com estes Termos de Serviço. Se você não concorda, não deve usar o jogo.</p>
          <p>O Bullet Overflow é um projeto acadêmico desenvolvido por estudantes da 42 como parte do projeto ft_transcendence, com fins educacionais. Não é um produto comercial.</p>
          
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
          <p>Ao usar o Bullet Overflow, você concorda em <strong>não</strong>:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-zinc-400">
            <li>Utilizar bots, macros, cheats ou qualquer forma de automação para obter vantagem indevida em partidas.</li>
            <li>Explorar bugs ou falhas do jogo de forma intencional para prejudicar outros jogadores ou manipular resultados/ranking.</li>
            <li>Assediar, ameaçar ou abusar de outros jogadores (inclusive através de nome de usuário ou avatar ofensivo).</li>
            <li>Tentar acessar contas de outros usuários ou obter acesso não autorizado aos nossos sistemas.</li>
            <li>Usar o serviço para qualquer finalidade ilegal.</li>
          </ul>
          <p>Reservamo-nos o direito de suspender ou registrar o encerramento de contas que violem estas regras.</p>
          
          <h3 className="font-bold text-white text-base mt-2">6. Propriedade intelectual</h3>
          <p>O código-fonte, arte, personagens, arenas e demais conteúdos originais do Bullet Overflow pertencem à equipe desenvolvedora do projeto. Ativos de terceiros (fontes, sprites, bibliotecas) usados no jogo mantêm suas respectivas licenças originais.</p>
          <p>Você não tem permissão para redistribuir, revender ou reivindicar autoria do jogo ou de seu conteúdo original.</p>
          
          <h3 className="font-bold text-white text-base mt-2">7. Natureza acadêmica do projeto</h3>
          <p>Por ser um projeto educacional em desenvolvimento contínuo, o Bullet Overflow pode:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-zinc-400">
            <li>Passar por instabilidades, manutenções ou indisponibilidade sem aviso prévio.</li>
            <li>Ter dados de contas e partidas reiniciados durante o desenvolvimento ou avaliação do projeto.</li>
            <li>Ser descontinuado ao final do ciclo de avaliação acadêmica.</li>
          </ul>
          <p>Não garantimos disponibilidade contínua do serviço.</p>
          
          <h3 className="font-bold text-white text-base mt-2">8. Isenção de garantias e limitação de responsabilidade</h3>
          <p>O Bullet Overflow é fornecido "como está", sem garantias de qualquer tipo, expressas ou implícitas. Não nos responsabilizamos por perdas de dados, indisponibilidade do serviço ou quaisquer danos decorrentes do uso do jogo, na máxima extensão permitida por lei.</p>
          
          <h3 className="font-bold text-white text-base mt-2">9. Encerramento de conta</h3>
          <p>Você pode solicitar o encerramento da sua conta a qualquer momento (veja a seção de contato). Também podemos suspender ou encerrar contas que violem estes Termos, a nosso critério.</p>
          
          <h3 className="font-bold text-white text-base mt-2">10. Alterações nestes termos</h3>
          <p>Podemos atualizar estes Termos de Serviço conforme o projeto evolui. Mudanças relevantes serão comunicadas na própria aplicação. O uso continuado do jogo após uma atualização implica aceitação dos novos termos.</p>
          
          <h3 className="font-bold text-white text-base mt-2">11. Lei aplicável</h3>
          <p>Estes termos são regidos pelas leis do Brasil.</p>
          
          <h3 className="font-bold text-white text-base mt-2">12. Contato</h3>
          <p className="text-zinc-400">Dúvidas sobre estes Termos de Serviço podem ser enviadas para luinasci@student.42sp.org.br, jcologne@student.42sp.org.br, tguilher@student.42sp.org.br ou lilmende@student.42sp.org.br.</p>
        </div>
        
        {/* Rodapé */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 text-right">
          <button onClick={onClose} className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-500 cursor-pointer">Entendi</button>
        </div>
        
      </div>
    </div>
  );
}
