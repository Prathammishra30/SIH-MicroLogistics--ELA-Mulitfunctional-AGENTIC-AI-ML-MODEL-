/* eslint-disable react-refresh/only-export-components */
// ELA Agent Global Context & Voice Integration
// Provides Speech-to-Text, Text-to-Speech, ML Telemetry, and Feedback State

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SpeechService, type SupportedSpeechLang } from '../services/speechService';
import { sendElaFeedback } from '../services/elaApi';
import { useLanguage } from './LanguageContext';

export interface ElaContextType {
  isListening: boolean;
  isSpeaking: boolean;
  isSTTSupported: boolean;
  isTTSSupported: boolean;
  startVoiceInput: (onTranscript: (text: string) => void) => boolean;
  stopVoiceInput: () => void;
  speakResponse: (text: string) => void;
  stopSpeaking: () => void;
  submitFeedback: (rating: 'POSITIVE' | 'NEGATIVE', feedbackText?: string) => Promise<void>;
}

const ElaContext = createContext<ElaContextType | undefined>(undefined);

export const ElaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSTTSupported] = useState(() => SpeechService.isSTTSupported());
  const [isTTSSupported] = useState(() => SpeechService.isTTSSupported());

  const startVoiceInput = useCallback(
    (onTranscript: (text: string) => void): boolean => {
      const validLang = (language || 'en') as SupportedSpeechLang;
      setIsListening(true);

      return SpeechService.startListening(
        validLang,
        (transcript) => {
          if (transcript) {
            onTranscript(transcript);
          }
        },
        () => {
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    },
    [language]
  );

  const stopVoiceInput = useCallback(() => {
    SpeechService.stopListening();
    setIsListening(false);
  }, []);

  const speakResponse = useCallback(
    (text: string) => {
      const validLang = (language || 'en') as SupportedSpeechLang;
      setIsSpeaking(true);
      SpeechService.speakText(text, validLang);
      setTimeout(() => setIsSpeaking(false), 4000);
    },
    [language]
  );

  const stopSpeaking = useCallback(() => {
    SpeechService.stopSpeaking();
    setIsSpeaking(false);
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
        isListening,
        isSpeaking,
        isSTTSupported,
        isTTSSupported,
        startVoiceInput,
        stopVoiceInput,
        speakResponse,
        stopSpeaking,
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
