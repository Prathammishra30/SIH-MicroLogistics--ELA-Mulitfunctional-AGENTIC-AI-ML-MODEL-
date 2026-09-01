// ELA Floating Assistant Widget (Universal Project-Level Architecture)
// RuralFlow / AgriRoute Multilingual Logistics Intelligence Assistant Floating Control

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSharedContext } from '../../context/SharedContext';
import { ElaChat } from './ElaChat';

export const ElaWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { state } = useSharedContext();
  const location = useLocation();

  // Only display authenticated portal role badge when actively inside authenticated dashboards
  const isInsideDashboard = location.pathname.startsWith('/dashboards/');
  const activeRoleBadge =
    isInsideDashboard && state.auth.isAuthenticated && state.auth.user?.role
      ? `${state.auth.user.role.charAt(0).toUpperCase() + state.auth.user.role.slice(1).toLowerCase()}`
      : 'Universal AI';

  // Listen to open-ela-chat event and Escape key
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('open-ela-chat', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('open-ela-chat', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Expanded Chat Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mb-4 origin-bottom-right"
          >
            <ElaChat onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Trigger Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('ela.helpTooltip') || 'Chat with ELA Logistics Assistant'}
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
  );
};

export const ElaAssistant = ElaWidget;
