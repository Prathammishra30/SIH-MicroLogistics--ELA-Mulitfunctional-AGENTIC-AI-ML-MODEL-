// ELA Chat Window Component
// RuralFlow Multilingual Logistics Intelligence Assistant UI

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Sparkles, Trash2, X, RefreshCw } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import type { ElaMessage as ElaMessageType } from '../../services/elaApi';
import { sendElaChatMessage } from '../../services/elaApi';
import { ElaMessage } from './ElaMessage';
import { ElaInput } from './ElaInput';
import { ElaSuggestions } from './ElaSuggestions';

interface ElaChatProps {
  onClose: () => void;
}

export const ElaChat: React.FC<ElaChatProps> = ({ onClose }) => {
  const { state } = useSharedContext();
  const { language, t } = useLanguage();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserRole = state.auth.user?.role || 'GUEST';
  const currentUserName = state.auth.user?.name || '';

  const getInitialWelcomeMessage = useCallback((): ElaMessageType => {
    let welcomeText: string;
    if (currentUserRole === 'FARMER') {
      welcomeText = language === 'mr'
        ? `नमस्कार ${currentUserName || 'शेतकरी मित्र'}! मी ईला (ELA), तुमची रूरलफ्लो लॉजिस्टिक्स सहाय्यक. मी पिके नोंदवणे, वाहतूक शोधणे किंवा डिलिव्हरी ट्रॅक करण्यात कशी मदत करू?`
        : language === 'hi'
        ? `नमस्ते ${currentUserName || 'किसान भाई'}! मैं ईला (ELA) हूँ। अपनी फसल सूची, गाड़ी बुकिंग या डिलीवरी ट्रैकिंग के लिए मुझसे पूछें।`
        : `Hello ${currentUserName || 'Farmer'}! I'm ELA, your RuralFlow logistics assistant. How can I help with your products, transport requests, or deliveries today?`;
    } else if (currentUserRole === 'BUYER') {
      welcomeText = language === 'mr'
        ? `नमस्कार ${currentUserName || 'व्यापारी मित्र'}! मी ईला (ELA). खरेदी मागणी (Procurement) नोंदवण्यासाठी किंवा शेतमाल शोधण्यासाठी मी सज्ज आहे.`
        : language === 'hi'
        ? `नमस्ते ${currentUserName || 'व्यापारी जी'}! मैं ईला (ELA) हूँ। खरीद मांग पोस्ट करने या किसान उपज खोजने के लिए मुझसे पूछें।`
        : `Hello ${currentUserName || 'Buyer'}! I'm ELA. I can assist you in posting bulk procurement orders and finding fresh farm produce.`;
    } else if (currentUserRole === 'TRANSPORTER') {
      welcomeText = language === 'mr'
        ? `नमस्कार ${currentUserName || 'वाहतूकदार मित्र'}! मी ईला (ELA). उपलब्ध फेऱ्या शोधणे, वाहने व्यवस्थापित करणे किंवा कमाई तपासण्यात मी मदत करू शकेन.`
        : language === 'hi'
        ? `नमस्ते ${currentUserName || 'ट्रांसपोर्टर जी'}! मैं ईला (ELA) हूँ। उपलब्ध ट्रिप्स खोजने, गाड़ी प्रबंधन या कमाई देखने में मैं आपकी सहायता करूँगी।`
        : `Hello ${currentUserName || 'Transporter'}! I'm ELA. I can help you find available pickup loads, manage your fleet, and track trips.`;
    } else {
      welcomeText = language === 'mr'
        ? 'नमस्कार! मी ईला (ELA), रूरलफ्लो लॉजिस्टिक्स सहाय्यक. शेतकरी, खरेदीदार किंवा वाहतूकदार पोर्टलवर जाण्यासाठी मला सांगा.'
        : language === 'hi'
        ? 'नमस्ते! मैं ईला (ELA) हूँ। किसान, खरीदार या ट्रांसपोर्टर पोर्टल में लॉगिन या मार्गदर्शन के लिए मुझसे पूछें।'
        : "Hello! I'm ELA, RuralFlow's multilingual logistics intelligence assistant. How can I assist you today?";
    }

    return {
      id: 'welcome-msg',
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date().toISOString(),
      suggestions: getDefaultSuggestions(currentUserRole, language),
    };
  }, [currentUserRole, currentUserName, language]);

  const [messages, setMessages] = useState<ElaMessageType[]>(() => {
    try {
      const saved = sessionStorage.getItem(`ruralflow_ela_chat_${currentUserRole}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fall through to initial
    }
    return [getInitialWelcomeMessage()];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>(() =>
    getDefaultSuggestions(currentUserRole, language)
  );

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Persist conversation per role in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `ruralflow_ela_chat_${currentUserRole}`,
        JSON.stringify(messages)
      );
    } catch {
      // Storage unavailable
    }
  }, [messages, currentUserRole]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ElaMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await sendElaChatMessage(text, historyPayload, {
        role: currentUserRole,
        language,
        currentPage: location.pathname,
        userName: currentUserName,
      });

      const assistantMsg: ElaMessageType = {
        id: `ela-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp || new Date().toISOString(),
        navigationAction: response.navigationAction || null,
        suggestions: response.suggestions || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.suggestions && response.suggestions.length > 0) {
        setCurrentSuggestions(response.suggestions);
      }
    } catch (error) {
      const errorMsg: ElaMessageType = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          error instanceof Error
            ? error.message
            : t('ela.error') || 'Sorry, I encountered an issue. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const freshWelcome = getInitialWelcomeMessage();
    setMessages([freshWelcome]);
    setCurrentSuggestions(freshWelcome.suggestions || []);
    sessionStorage.removeItem(`ruralflow_ela_chat_${currentUserRole}`);
  };

  return (
    <div className="flex flex-col h-[520px] max-h-[85vh] w-full max-w-[420px] bg-slate-50/95 backdrop-blur-md rounded-3xl shadow-2xl border border-green-200/90 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-4 py-3.5 bg-linear-to-r from-[#1B5E20] via-[#2E7D32] to-[#388E3C] text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-xs">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-[#1B5E20]" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-white tracking-wide">
                {t('ela.title') || 'ELA AI Assistant'}
              </h3>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-green-100 font-medium">
              <span className="capitalize">
                {currentUserRole === 'GUEST' ? 'Guest' : currentUserRole.toLowerCase()}
              </span>
              <span>•</span>
              <span className="text-emerald-200">{t('ela.online') || 'Online'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearChat}
            title={t('ela.clear') || 'Clear Chat'}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2 scroll-smooth">
        {messages.map((msg) => (
          <ElaMessage key={msg.id} message={msg} onNavigate={onClose} />
        ))}

        {/* Thinking State */}
        {isLoading && (
          <div className="flex items-center gap-2.5 my-3">
            <div className="w-7 h-7 rounded-xl bg-linear-to-br from-[#2E7D32] to-[#1B5E20] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 rounded-tl-xs flex items-center gap-1.5 shadow-xs">
              <span>{t('ela.thinking') || 'ELA is thinking'}</span>
              <span className="flex gap-1 items-center ml-1">
                <span className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {currentSuggestions.length > 0 && !isLoading && (
        <ElaSuggestions
          suggestions={currentSuggestions}
          onSelectSuggestion={handleSendMessage}
          disabled={isLoading}
        />
      )}

      {/* Input Field */}
      <ElaInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        autoFocus={true}
      />
    </div>
  );
};

function getDefaultSuggestions(role: string, lang: string): string[] {
  if (role === 'FARMER') {
    if (lang === 'mr') return ['माझी उत्पादने', 'वाहतूक मागणी', 'बाजार मागणी', 'माझी डिलिव्हरी'];
    if (lang === 'hi') return ['मेरे उत्पाद', 'गाड़ी बुक करें', 'मंडी मांग', 'मेरी डिलीवरी'];
    return ['My Products', 'Logistics Request', 'Market Demand', 'My Deliveries'];
  }
  if (role === 'BUYER') {
    if (lang === 'mr') return ['खरेदी मागणी नोंदवा', 'शेतमाल शोधा', 'माझ्या ऑर्डर्स'];
    if (lang === 'hi') return ['खरीद मांग पोस्ट करें', 'उपज देखें', 'मेरे ऑर्डर्स'];
    return ['Post Procurement', 'Produce Catalog', 'My Orders'];
  }
  if (role === 'TRANSPORTER') {
    if (lang === 'mr') return ['उपलब्ध फेऱ्या', 'माझी वाहने', 'सक्रिय फेऱ्या', 'माझी कमाई'];
    if (lang === 'hi') return ['उपलब्ध ट्रिप्स', 'मेरी गाड़ियां', 'सक्रिय फेऱ्या', 'मेरी कमाई'];
    return ['Available Trips', 'My Vehicles', 'Active Trips', 'My Earnings'];
  }

  // Guest / Common
  if (lang === 'mr') return ['शेतकरी लॉगिन', 'व्यापारी लॉगिन', 'वाहतूकदार लॉगिन', 'मुख्य पृष्ठ'];
  if (lang === 'hi') return ['किसान लॉगिन', 'व्यापारी लॉगिन', 'ट्रांसपोर्टर लॉगिन', 'मुख्य पृष्ठ'];
  return ['Farmer Login', 'Buyer Login', 'Transporter Login', 'Home Page'];
}
