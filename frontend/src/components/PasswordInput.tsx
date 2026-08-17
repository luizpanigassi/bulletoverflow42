import { useState } from "react";


interface PasswordInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function PasswordInput({ value, onChange, placeholder = "••••••••", required = false }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-2 pr-10 text-white text-sm focus:outline-none transition-all"
        placeholder={placeholder}
        required={required}
      />

      {/* Botão do Olho com SVG Nativo */}
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer select-none"
      >
        {showPassword ? (
          /* Ícone: Olho Aberto */
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        ) : (
          /* Ícone: Pálpebra Fechada Minimalista com Cílios*/
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10c0 0 4.5 6 9 6s9-6 9-6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v3M7 14l-1.5 2.5M17 14l1.5 2.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
