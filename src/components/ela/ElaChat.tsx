// ELA Chat Window Component (Phase 2 Agentic Action & Confirmation UI)
// AgriRoute / RuralFlow Universal Multilingual Logistics Intelligence Assistant

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Sparkles, Trash2, X, RefreshCw } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import type {
  ElaMessage as ElaMessageType,
  ElaConfirmationAction,
} from '../../services/elaApi';
import { sendElaChatMessage, confirmElaAction } from '../../services/elaApi';
import { ElaMessage } from './ElaMessage';
import { ElaInput } from './ElaInput';
import { ElaSuggestions } from './ElaSuggestions';

interface ElaChatProps {
  onClose: () => void;
}

export const ElaChat: React.FC<ElaChatProps> = ({ onClose }) => {
  const { state, loadUserBusinessData } = useSharedContext();
  const { language, t } = useLanguage();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserRole = state.auth.user?.role || 'GUEST';
  const currentUserName = state.auth.user?.name || '';

  const getInitialWelcomeMessage = useCallback((): ElaMessageType => {
    let welcomeText: string;
    if (currentUserRole === 'FARMER') {
      welcomeText =
        language === 'mr'
          ? `नमस्कार ${currentUserName || 'शेतकरी मित्र'}! मी ईला (ELA), तुमची अ‍ॅग्रीरूट लॉजिस्टिक्स सहाय्यक. मी पिके नोंदवणे, वाहतूक मागवणे किंवा डिलिव्हरी ट्रॅक करण्यात मदत करू शकते.`
          : language === 'hi'
          ? `नमस्ते ${currentUserName || 'किसान भाई'}! मैं ईला (ELA) हूँ। अपनी फसल जोड़ने, गाड़ी बुक करने या डिलीवरी देखने के लिए मुझसे पूछें।`
          : `Hello ${currentUserName || 'Farmer'}! I'm ELA, your AgriRoute logistics assistant. I can help you list crops, request transport, or track deliveries.`;
    } else if (currentUserRole === 'BUYER') {
      welcomeText =
        language === 'mr'
          ? `नमस्कार ${currentUserName || 'व्यापारी मित्र'}! मी ईला (ELA). थेट शेतमाल शोधण्यासाठी किंवा खरेदी मागणी (Procurement) नोंदवण्यासाठी मी सज्ज आहे.`
          : language === 'hi'
          ? `नमस्ते ${currentUserName || 'व्यापारी जी'}! मैं ईला (ELA) हूँ। किसानों से ताज़ा उपज खरीदने या खरीद मांग पोस्ट करने के लिए मुझसे कहें।`
          : `Hello ${currentUserName || 'Buyer'}! I'm ELA. I can assist you with discovering farm fresh produce, posting bulk procurement demands, and tracking orders.`;
    } else if (currentUserRole === 'TRANSPORTER') {
      welcomeText =
        language === 'mr'
          ? `नमस्कार ${currentUserName || 'वाहतूकदार मित्र'}! मी ईला (ELA). उपलब्ध फेऱ्या शोधणे, वाहने व्यवस्थापित करणे किंवा कमाई तपासण्यात मी मदत करू शकेन.`
          : language === 'hi'
          ? `नमस्ते ${currentUserName || 'ट्रांसपोर्टर जी'}! मैं ईला (ELA) हूँ। उपलब्ध ट्रिप्स खोजने, गाड़ी प्रबंधन या कमाई देखने में मैं आपकी सहायता करूँगी।`
          : `Hello ${currentUserName || 'Transporter'}! I'm ELA. I can help you find available loads, manage vehicles, track trips, and view earnings.`;
    } else {
      welcomeText =
        language === 'mr'
          ? 'नमस्कार! मी ईला (ELA), अ‍ॅग्रीरूट लॉजिस्टिक्स सहाय्यक. शेतकरी, खरेदीदार किंवा वाहतूकदार पोर्टलमध्ये प्रवेश करण्यासाठी मला सांगा.'
          : language === 'hi'
          ? 'नमस्ते! मैं ईला (ELA) हूँ। किसान, खरीदार या ट्रांसपोर्टर पोर्टल में लॉगिन, रजिस्ट्रेशन या मार्गदर्शन के लिए मुझसे पूछें।'
          : "Hello! I'm ELA, AgriRoute's universal logistics intelligence assistant. How can I help you navigate or get started today?";
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
    const trimmed = text.trim();
    if (!trimmed) return;

    // Client-side Credential Shield: Intercept raw passwords/OTPs before storing or sending
    if (/\b(password|passcode|secret|otp|verification code|pin|123456|cvv)\b/i.test(trimmed)) {
      const shieldMsg: ElaMessageType = {
        id: `shield-${Date.now()}`,
        role: 'assistant',
        content:
          t('ela.sensitiveCredentialShield') ||
          'Please enter your password or OTP directly into the secure form. For your protection, ELA never handles, stores, or transmits passwords or verification codes.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', content: '[Sensitive Credential Shielded]', timestamp: new Date().toISOString() },
        shieldMsg,
      ]);
      return;
    }

    const userMsg: ElaMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
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

      const response = await sendElaChatMessage(trimmed, historyPayload, {
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
        confirmationAction: response.confirmationAction || null,
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

  const handleConfirmAction = async (action: ElaConfirmationAction) => {
    try {
      const result = await confirmElaAction({
        actionId: action.actionId,
        toolName: action.toolName,
        params: action.params,
        confirmed: true,
        language,
      });

      const confirmMsg: ElaMessageType = {
        id: `confirm-res-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, confirmMsg]);

      // Auto-refresh live dashboard state in background
      if (state.auth.user) {
        await loadUserBusinessData(state.auth.user);
      }
    } catch (err) {
      const errorMsg: ElaMessageType = {
        id: `confirm-err-${Date.now()}`,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Action execution failed.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleCancelAction = (action: ElaConfirmationAction) => {
    const cancelMsg: ElaMessageType = {
      id: `cancel-${Date.now()}`,
      role: 'assistant',
      content: `Action for **${action.title}** was cancelled.`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, cancelMsg]);
  };

  const handleClearChat = () => {
    const freshWelcome = getInitialWelcomeMessage();
    setMessages([freshWelcome]);
    setCurrentSuggestions(freshWelcome.suggestions || []);
    sessionStorage.removeItem(`ruralflow_ela_chat_${currentUserRole}`);
  };

  return (
    <div className="flex flex-col h-[560px] max-h-[85vh] w-full max-w-[420px] bg-slate-50/95 backdrop-blur-md rounded-3xl shadow-2xl border border-green-200/90 overflow-hidden font-sans">
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
            <div className="flex items-center gap-1.5 text-[11px] text-green-100 font-medium">
              <span className="text-emerald-200">{t('ela.online') || 'Online'}</span>
              {currentUserRole !== 'GUEST' && (
                <>
                  <span>•</span>
                  <span className="capitalize font-semibold text-white">
                    {currentUserRole.toLowerCase()}
                  </span>
                </>
              )}
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
          <ElaMessage
            key={msg.id}
            message={msg}
            onNavigate={onClose}
            onConfirmAction={handleConfirmAction}
            onCancelAction={handleCancelAction}
          />
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
