// ELA Voice Orb Component — Voice-First Female AI Identity
// Full audio-reactivity, authoritative MicrophoneState machine, explicit female voice indicator, and Replay control

import React from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  Volume2,
  VolumeX,
  MessageSquareText,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { useEla } from '../../context/ElaContext';

interface ElaOrbProps {
  caption: string;
  onToggleListening: () => void;
  onToggleTranscript: () => void;
  showTranscript: boolean;
}

export const ElaOrb: React.FC<ElaOrbProps> = ({
  caption,
  onToggleListening,
  onToggleTranscript,
  showTranscript,
}) => {
  const {
    micState,
    micVolume,
    partialTranscript,
    errorMessage,
    isListening,
    isSpeaking,
    isMuted,
    activeVoiceInfo,
    speakResponse,
    toggleMute,
    stopSpeaking,
  } = useEla();

  // Determine visual color scheme based on microphone & speech states
  const getOrbTheme = () => {
    if (micState === 'MIC_PERMISSION_DENIED' || micState === 'MIC_UNAVAILABLE' || micState === 'MIC_ERROR') {
      return {
        bg: 'from-rose-700 via-red-600 to-rose-800',
        glow: 'shadow-[0_0_50px_rgba(225,29,72,0.4)]',
        ring: 'border-rose-500/50',
      };
    }
    if (micState === 'MIC_REQUESTING_PERMISSION') {
      return {
        bg: 'from-amber-600 via-yellow-500 to-amber-700',
        glow: 'shadow-[0_0_50px_rgba(245,158,11,0.4)]',
        ring: 'border-amber-400/50',
      };
    }
    if (micState === 'MIC_SPEECH_DETECTED' || micState === 'MIC_TRANSCRIBING') {
      return {
        bg: 'from-rose-500 via-pink-500 to-rose-600',
        glow: 'shadow-[0_0_70px_rgba(244,63,94,0.6)]',
        ring: 'border-rose-400/70',
      };
    }
    if (micState === 'MIC_LISTENING') {
      return {
        bg: 'from-rose-600 via-red-500 to-rose-700',
        glow: 'shadow-[0_0_55px_rgba(244,63,94,0.45)]',
        ring: 'border-rose-400/50',
      };
    }
    if (isSpeaking) {
      return {
        bg: 'from-emerald-500 via-teal-400 to-green-600',
        glow: 'shadow-[0_0_65px_rgba(16,185,129,0.55)]',
        ring: 'border-emerald-300/60',
      };
    }
    // Idle theme
    return {
      bg: 'from-emerald-600 via-teal-500 to-emerald-700',
      glow: 'shadow-[0_0_50px_rgba(16,185,129,0.35)]',
      ring: 'border-emerald-400/30',
    };
  };

  const theme = getOrbTheme();

  // Dynamic scale calculated from real-time audio volume
  const dynamicScale = micState === 'MIC_SPEECH_DETECTED' || micState === 'MIC_TRANSCRIBING'
    ? 1.0 + micVolume * 0.35
    : 1.0;

  return (
    <div className="flex flex-col items-center gap-3.5 py-5 px-4 font-sans">
      {/* Active Female Voice Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        <span className="font-semibold text-emerald-400">ELA (Female)</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-400 truncate max-w-[200px]" title={activeVoiceInfo.voiceName}>
          {activeVoiceInfo.voiceName.replace(/Online \(Natural\)|Microsoft|Google/g, '').trim() || 'Female Voice'}
        </span>
      </div>

      {/* Animated Audio-Reactive Orb */}
      <div className="relative flex items-center justify-center my-2">
        {/* Outer Ring — Scaled with Mic Volume when listening */}
        <motion.div
          animate={
            isSpeaking
              ? { scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }
              : isListening
              ? { scale: [dynamicScale, dynamicScale * 1.25, dynamicScale], opacity: [0.6, 0.2, 0.6] }
              : { scale: [1, 1.12, 1], opacity: [0.3, 0.15, 0.3] }
          }
          transition={{
            duration: isListening ? 0.9 : isSpeaking ? 1.4 : 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute w-32 h-32 rounded-full border-2 ${theme.ring}`}
        />

        {/* Inner Wave Ring (Active when listening or speaking) */}
        {(isListening || isSpeaking) && (
          <motion.div
            animate={{
              scale: [1, 1.15 + (micVolume || 0) * 0.2, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: isListening ? 0.7 : 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.15,
            }}
            className={`absolute w-28 h-28 rounded-full border ${theme.ring}`}
          />
        )}

        {/* Main Interactive Orb Button */}
        <motion.button
          type="button"
          onClick={onToggleListening}
          animate={{
            scale: isListening ? dynamicScale : [1, 1.04, 1],
          }}
          transition={{
            duration: isListening ? 0.1 : 3.5,
            repeat: isListening ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${theme.bg} ${theme.glow} flex items-center justify-center cursor-pointer transition-all duration-200 z-10`}
          aria-label={isListening ? 'Stop listening' : 'Talk to ELA'}
        >
          {isListening ? (
            // LIVE ACTIVE UNMUTED MICROPHONE
            <div className="relative flex items-center justify-center">
              <Mic className="w-10 h-10 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
            </div>
          ) : isSpeaking ? (
            <Volume2 className="w-9 h-9 text-white drop-shadow-lg animate-pulse" />
          ) : micState === 'MIC_REQUESTING_PERMISSION' ? (
            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : micState === 'MIC_PERMISSION_DENIED' ? (
            <ShieldAlert className="w-8 h-8 text-white drop-shadow-lg" />
          ) : micState === 'MIC_UNAVAILABLE' || micState === 'MIC_ERROR' ? (
            <AlertCircle className="w-8 h-8 text-white drop-shadow-lg" />
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <Mic className="w-8 h-8 text-white drop-shadow-lg" />
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
          )}
        </motion.button>
      </div>

      {/* Real-time State Label */}
      <div className="flex items-center gap-2 text-xs font-medium">
        {micState === 'MIC_REQUESTING_PERMISSION' && (
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Requesting microphone permission...
          </span>
        )}
        {micState === 'MIC_LISTENING' && (
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Microphone active — Listening...
          </span>
        )}
        {micState === 'MIC_SPEECH_DETECTED' && (
          <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
            Voice detected — Speak now...
          </span>
        )}
        {micState === 'MIC_TRANSCRIBING' && (
          <span className="flex items-center gap-1.5 text-pink-300">
            <Sparkles className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
            Transcribing speech...
          </span>
        )}
        {micState === 'MIC_PERMISSION_DENIED' && (
          <span className="text-rose-400 text-center text-[11px] leading-tight max-w-xs">
            Microphone permission denied. Please allow microphone access in your browser settings.
          </span>
        )}
        {micState === 'MIC_UNAVAILABLE' && (
          <span className="text-rose-400 text-center text-[11px]">
            Microphone hardware not available on this device.
          </span>
        )}
        {micState === 'MIC_ERROR' && (
          <span className="text-rose-400 text-center text-[11px]">
            {errorMessage || 'Microphone error. Tap to retry.'}
          </span>
        )}
        {isSpeaking && !isListening && (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            Speaking in female voice...
          </span>
        )}
        {micState === 'MIC_IDLE' && !isSpeaking && (
          <span className="text-slate-400">Tap orb to speak</span>
        )}
      </div>

      {/* Real-time Partial Transcript Indicator */}
      {partialTranscript && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/30 rounded-xl text-xs text-rose-200 text-center max-w-xs"
        >
          <span className="font-semibold text-rose-400 mr-1">Heard:</span> &ldquo;{partialTranscript}&rdquo;
        </motion.div>
      )}

      {/* Caption Text (ELA's greeting or latest response) */}
      {caption && !partialTranscript && (
        <div className="max-w-sm text-center text-sm text-slate-300 leading-relaxed px-2 line-clamp-4 whitespace-pre-line">
          {caption}
        </div>
      )}

      {/* Controls Bar: Mute, Stop, Replay, Transcript Toggle */}
      <div className="flex items-center gap-3 mt-0.5">
        {/* Mute / Unmute Female Voice */}
        <button
          type="button"
          onClick={toggleMute}
          className={`p-2 rounded-full transition-all cursor-pointer ${
            isMuted
              ? 'bg-slate-700 text-slate-400 hover:text-white'
              : 'bg-slate-800 text-emerald-400 hover:text-emerald-300'
          }`}
          title={isMuted ? 'Unmute ELA female voice' : 'Mute ELA voice'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Stop Speaking (Visible only while speaking) */}
        {isSpeaking && (
          <button
            type="button"
            onClick={stopSpeaking}
            className="p-2 rounded-full bg-slate-800 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
            title="Stop speech"
          >
            <VolumeX className="w-4 h-4" />
          </button>
        )}

        {/* Replay Latest Response (Only if caption exists and not currently speaking) */}
        {caption && !isSpeaking && (
          <button
            type="button"
            onClick={() => speakResponse(caption)}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-all cursor-pointer"
            title="Replay spoken response"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Toggle Transcript View */}
        <button
          type="button"
          onClick={onToggleTranscript}
          className={`p-2 rounded-full transition-all cursor-pointer ${
            showTranscript
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
          title={showTranscript ? 'Hide transcript' : 'Show transcript'}
        >
          <MessageSquareText className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
