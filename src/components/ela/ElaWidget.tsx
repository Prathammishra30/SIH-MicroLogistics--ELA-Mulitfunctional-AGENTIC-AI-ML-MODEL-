// ELA Floating Assistant Widget (Universal Project-Level Architecture)
// RuralFlow / AgriRoute Multilingual Logistics Intelligence Assistant
// Voice-first orb interface with collapsible transcript view

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSharedContext } from '../../context/SharedContext';
import { useEla } from '../../context/ElaContext';
import { ElaChat } from './ElaChat';
import { ElaOrb } from './ElaOrb';

export const ElaWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [userOrbCaption, setUserOrbCaption] = useState('');
  const { t, language } = useLanguage();
  const { state } = useSharedContext();
  const { speakResponse, isListening, startVoiceInput, stopVoiceInput, isMuted } = useEla();
  const location = useLocation();

  // Only display authenticated portal role badge when actively inside authenticated dashboards
  const isInsideDashboard = location.pathname.startsWith('/dashboards/');
  const activeRoleBadge =
    isInsideDashboard && state.auth.isAuthenticated && state.auth.user?.role
      ? `${state.auth.user.role.charAt(0).toUpperCase() + state.auth.user.role.slice(1).toLowerCase()}`
      : 'Universal AI';

  // Greeting text by language (derived, never redundantly synchronized via effect)
  const getGreetingText = useCallback(() => {
    if (language === 'hi') return 'नमस्ते! मैं ELA हूँ। मैं आपकी कैसे मदद कर सकती हूँ?';
    if (language === 'mr') return 'नमस्कार! मी ELA. मी तुम्हाला कशी मदत करू शकते?';
    if (language === 'ta') return 'வணக்கம்! நான் ELA. நான் உங்களுக்கு எப்படி உதவ முடியும்?';
    if (language === 'te') return 'నమస్కారం! నేను ELA. నేను మీకు ఎలా సహాయం చేయగలను?';
    if (language === 'bn') return 'নমস্কার! আমি ELA। আমি আপনাকে কীভাবে সাহায্য করতে পারি?';
    if (language === 'kn') return 'ನಮಸ್ಕಾರ! ನಾನು ELA. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?';
    return 'How can I help you?\nमैं आपकी कैसे मदद कर सकती हूँ?';
  }, [language]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setShowTranscript(false);
    setUserOrbCaption('');
    const greeting = getGreetingText();
    if (!isMuted) {
      // Small delay to let the orb render first
      setTimeout(() => {
        speakResponse(greeting);
      }, 400);
    }
  }, [getGreetingText, isMuted, speakResponse]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowTranscript(false);
    setUserOrbCaption('');
  }, []);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [isOpen, handleClose, handleOpen]);

  // Listen to open-ela-chat event and Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('open-ela-chat', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('open-ela-chat', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleOpen, handleClose]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput((transcript, confidence) => {
        setUserOrbCaption(`You: "${transcript}"`);
        // The transcript will be sent through ElaChat's handleSendMessage
        // Dispatch a custom event that ElaChat listens to
        window.dispatchEvent(
          new CustomEvent('ela-voice-transcript', { detail: { transcript, confidence } })
        );
      });
    }
  };

  // Listen for ELA response updates to show on orb caption
  useEffect(() => {
    const handleResponse = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        setUserOrbCaption(detail.message);
      }
    };
    window.addEventListener('ela-response', handleResponse);
    return () => window.removeEventListener('ela-response', handleResponse);
  }, []);

  const orbCaption = userOrbCaption || getGreetingText();

  return (
    <>
      {/* Backdrop overlay when orb is open (P5 fix — prevents content overlap) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        {/* Expanded Orb + Transcript Popover */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="mb-4 origin-bottom-right"
            >
              <div className="w-[380px] sm:w-[430px] max-h-[85vh] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-900/30">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        ELA <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      </h3>
                      <span className="text-[10px] text-emerald-400 font-mono tracking-tight">
                        Voice Assistant
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Voice Orb — Primary View */}
                <ElaOrb
                  caption={orbCaption}
                  onToggleListening={handleVoiceToggle}
                  onToggleTranscript={() => setShowTranscript((prev) => !prev)}
                  showTranscript={showTranscript}
                />

                {/* Collapsible Chat Transcript */}
                <AnimatePresence>
                  {showTranscript && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-slate-800"
                    >
                      <div className="h-[300px]">
                        <ElaChat
                          onClose={() => setShowTranscript(false)}
                          transcriptMode
                          onOrbResponse={(msg: string) => setUserOrbCaption(msg)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Trigger Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          aria-label={t('ela.helpTooltip') || 'Talk to ELA Voice Assistant'}
          className={`relative group flex items-center gap-2.5 px-4 py-3 rounded-full font-sans shadow-xl border cursor-pointer transition-all duration-300 ${
            isOpen
              ? 'bg-slate-800 text-white border-slate-700 shadow-slate-900/30'
              : 'bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#388E3C] text-white border-green-400/40 shadow-green-900/30 hover:shadow-green-900/40'
          }`}
        >
          {/* Pulsing indicator when closed */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white shadow-xs" />
            </span>
          )}

          <div className="flex items-center justify-center">
            {isOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Bot className="w-5 h-5 text-white animate-bounce-subtle" />
            )}
          </div>

          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm tracking-wide">
                {isOpen ? 'Close' : 'ELA'}
              </span>
              {!isOpen && <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />}
            </div>
            {!isOpen && (
              <span className="text-[10px] text-green-100 font-medium tracking-tight">
                {activeRoleBadge}
              </span>
            )}
          </div>
        </motion.button>
      </div>
    </>
  );
};

export const ElaAssistant = ElaWidget;
