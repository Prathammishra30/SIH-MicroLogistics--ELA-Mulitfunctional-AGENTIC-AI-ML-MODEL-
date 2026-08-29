// ELA Voice Button Component (Phase 1 UI / Prepared for Phase 4 Voice Integration)
// RuralFlow Multilingual Logistics Intelligence Assistant

import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ElaVoiceButtonProps {
  disabled?: boolean;
}

export const ElaVoiceButton: React.FC<ElaVoiceButtonProps> = ({ disabled = false }) => {
  const { t } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowTooltip(true)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Voice input"
        className="p-2.5 rounded-xl text-slate-400 hover:text-[#2E7D32] hover:bg-[#E8F5E9]/60 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-transparent hover:border-green-200"
      >
        <Mic className="w-5 h-5" />
      </button>

      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-medium rounded-lg whitespace-nowrap shadow-xl z-50 animate-fade-in pointer-events-none">
          {t('ela.voiceSoon') || 'Voice assistance coming soon in Phase 4'}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
        </div>
      )}
    </div>
  );
};
