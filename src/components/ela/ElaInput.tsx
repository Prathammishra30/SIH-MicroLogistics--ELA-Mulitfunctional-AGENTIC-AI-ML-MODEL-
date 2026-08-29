// ELA Input Component
// Chat message input with multilingual typing and voice readiness

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ElaVoiceButton } from './ElaVoiceButton';

interface ElaInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  autoFocus?: boolean;
}

export const ElaInput: React.FC<ElaInputProps> = ({
  onSendMessage,
  isLoading,
  autoFocus = true,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setText('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
    >
      <ElaVoiceButton disabled={isLoading} />

      <div className="flex-1 relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={isLoading}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            t('ela.placeholder') || 'Ask ELA in any language (e.g., "Show my deliveries")...'
          }
          className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl border border-slate-200 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all outline-hidden disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        aria-label={t('ela.send') || 'Send'}
        className="p-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white disabled:bg-slate-200 disabled:text-slate-400 shadow-xs hover:shadow-md active:scale-95 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
