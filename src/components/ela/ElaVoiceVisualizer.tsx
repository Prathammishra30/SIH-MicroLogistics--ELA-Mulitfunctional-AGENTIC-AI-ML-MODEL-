// ELA Voice Visualizer & Audio Controls Component
// Provides real-time microphone wave visualization and audio playback indicator

import React from 'react';
import { Mic, Volume2, VolumeX, Sparkles, Square } from 'lucide-react';
import { motion } from 'framer-motion';

interface ElaVoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  onToggleListening: () => void;
  onStopSpeaking?: () => void;
  disabled?: boolean;
}

export const ElaVoiceVisualizer: React.FC<ElaVoiceVisualizerProps> = ({
  isListening,
  isSpeaking,
  onToggleListening,
  onStopSpeaking,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Listening Wave Visualizer when Active */}
      {isListening && (
        <div className="flex items-center gap-1 px-3 py-1 bg-rose-950/60 border border-rose-500/40 rounded-full">
          <span className="text-[11px] font-mono text-rose-300 font-medium mr-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            Listening
          </span>
          {[0.3, 0.7, 1.0, 0.5, 0.8, 0.4].map((scale, i) => (
            <motion.span
              key={i}
              animate={{
                height: [4, 18 * scale, 4],
              }}
              transition={{
                duration: 0.6 + i * 0.1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-1 bg-rose-400 rounded-full"
            />
          ))}
        </div>
      )}

      {/* Speaking Visualizer when TTS Active */}
      {isSpeaking && !isListening && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-full">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-emerald-300 font-medium">Speaking...</span>
          {onStopSpeaking && (
            <button
              type="button"
              onClick={onStopSpeaking}
              className="ml-1 text-emerald-400 hover:text-emerald-200 cursor-pointer"
              title="Stop audio"
            >
              <VolumeX className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Main "Talk to ELA" Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleListening}
        aria-label={isListening ? 'Stop listening' : 'Talk to ELA'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105 border border-rose-400'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30 border border-emerald-400/40 active:scale-95'
        }`}
      >
        {isListening ? (
          <>
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span>Talk to ELA</span>
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
          </>
        )}
      </button>
    </div>
  );
};
