/* eslint-disable react-refresh/only-export-components */
// ELA Agent Global Context & Voice Integration
// Authoritative Microphone State Machine, Female TTS Voice Synthesis, and Telemetry

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  SpeechService,
  type SupportedSpeechLang,
  type MicrophoneState,
  type ActiveVoiceInfo,
  getActiveVoiceInfo,
} from '../services/speechService';
import { sendElaFeedback } from '../services/elaApi';
import { useLanguage } from './LanguageContext';

export interface ElaContextType {
  micState: MicrophoneState;
  micVolume: number;
  partialTranscript: string;
  errorMessage: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isSTTSupported: boolean;
  isTTSSupported: boolean;
  activeVoiceInfo: ActiveVoiceInfo;
  startVoiceInput: (onFinalTranscript: (text: string) => void) => Promise<boolean>;
  stopVoiceInput: () => void;
  speakResponse: (text: string) => void;
  stopSpeaking: () => void;
  toggleMute: () => void;
  submitFeedback: (rating: 'POSITIVE' | 'NEGATIVE', feedbackText?: string) => Promise<void>;
}

const ElaContext = createContext<ElaContextType | undefined>(undefined);

export const ElaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [micState, setMicState] = useState<MicrophoneState>('MIC_IDLE');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [partialTranscript, setPartialTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSTTSupported] = useState(() => SpeechService.isSTTSupported());
  const [isTTSSupported] = useState(() => SpeechService.isTTSSupported());
  const speakingRef = useRef(false);

  const activeVoiceInfo = getActiveVoiceInfo((language || 'en') as SupportedSpeechLang);

  // Derived listening state: true only when actively listening or detecting speech
  const isListening =
    micState === 'MIC_LISTENING' ||
    micState === 'MIC_SPEECH_DETECTED' ||
    micState === 'MIC_TRANSCRIBING';

  const startVoiceInput = useCallback(
    async (onFinalTranscript: (text: string) => void): Promise<boolean> => {
      const validLang = (language || 'en') as SupportedSpeechLang;
      setErrorMessage(null);
      setPartialTranscript('');

      return SpeechService.startListening({
        lang: validLang,
        onStateChange: (state, errorMsg) => {
          setMicState(state);
          if (errorMsg) {
            setErrorMessage(errorMsg);
          }
          if (state === 'MIC_IDLE' || state === 'MIC_ERROR' || state === 'MIC_PERMISSION_DENIED') {
            setPartialTranscript('');
            setMicVolume(0);
          }
        },
        onPartialTranscript: (partial) => {
          setPartialTranscript(partial);
        },
        onFinalTranscript: (final) => {
          setPartialTranscript('');
          if (final) {
            onFinalTranscript(final);
          }
        },
        onAudioVolume: (volume) => {
          setMicVolume(volume);
        },
      });
    },
    [language]
  );

  const stopVoiceInput = useCallback(() => {
    SpeechService.stopListening();
    setMicState('MIC_IDLE');
    setMicVolume(0);
    setPartialTranscript('');
  }, []);

  const speakResponse = useCallback(
    (text: string) => {
      if (isMuted) return;
      const validLang = (language || 'en') as SupportedSpeechLang;
      speakingRef.current = true;

      SpeechService.speakText(
        text,
        validLang,
        () => {
          // onStart: Enter SPEAKING state only after speech playback actually begins
          setIsSpeaking(true);
        },
        () => {
          // onEnd / onError: Reset SPEAKING state immediately
          speakingRef.current = false;
          setIsSpeaking(false);
        }
      );
    },
    [language, isMuted]
  );

  const stopSpeaking = useCallback(() => {
    SpeechService.stopSpeaking();
    speakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) {
        SpeechService.stopSpeaking();
        speakingRef.current = false;
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  const submitFeedback = useCallback(
    async (rating: 'POSITIVE' | 'NEGATIVE', feedbackText?: string) => {
      try {
        await sendElaFeedback({ rating, feedbackText });
      } catch {
        // Safe ignore
      }
    },
    []
  );

  return (
    <ElaContext.Provider
      value={{
        micState,
        micVolume,
        partialTranscript,
        errorMessage,
        isListening,
        isSpeaking,
        isMuted,
        isSTTSupported,
        isTTSSupported,
        activeVoiceInfo,
        startVoiceInput,
        stopVoiceInput,
        speakResponse,
        stopSpeaking,
        toggleMute,
        submitFeedback,
      }}
    >
      {children}
    </ElaContext.Provider>
  );
};

export function useEla(): ElaContextType {
  const context = useContext(ElaContext);
  if (!context) {
    throw new Error('useEla must be used within an ElaProvider');
  }
  return context;
}
