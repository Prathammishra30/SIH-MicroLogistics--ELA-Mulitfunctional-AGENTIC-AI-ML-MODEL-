// ELA Voice Microphone Input Component
// Real-time voice capture with pulsing listening wave

import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useEla } from '../../context/ElaContext';
import { useLanguage } from '../../context/LanguageContext';

interface ElaVoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const ElaVoiceInput: React.FC<ElaVoiceInputProps> = ({ onTranscript, disabled }) => {
  const { isListening, isSTTSupported, startVoiceInput, stopVoiceInput } = useEla();
  const { t } = useLanguage();

  const handleToggleListening = () => {
    if (disabled) return;

    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput((transcript) => {
        onTranscript(transcript);
      });
    }
  };

  if (!isSTTSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      disabled={disabled}
      title={isListening ? 'Stop listening' : t('ela.voicePrompt') || 'Speak to ELA'}
      className={`relative p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
        isListening
          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 active:scale-95'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};
