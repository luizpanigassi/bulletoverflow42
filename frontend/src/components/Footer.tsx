import { useState } from "react";
import { PrivacyModal } from "./PrivacyModal";
import { TermsModal } from "./TermsModal";

export function Footer() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <>
      <footer className="flex flex-wrap justify-between items-center gap-3 px-4 py-4 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500 select-none">
        <span className="inline-flex items-center gap-1.5 tracking-wide">
          <img src="/favicon.png" alt="Logo Bullet Overflow" className="w-6 h-6 object-contain" />
          <span>Bullet Overflow</span>
        </span>
        <div className="flex gap-4">
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="hover:text-white transition-colors uppercase tracking-wider font-bold cursor-pointer"
          >
            Política de Privacidade
          </button>
          <button
            onClick={() => setShowTermsModal(true)}
            className="hover:text-white transition-colors uppercase tracking-wider font-bold cursor-pointer"
          >
            Termos de Serviço
          </button>
        </div>
      </footer>

      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
}