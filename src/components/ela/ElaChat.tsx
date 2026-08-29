// ELA Chat Window Component (Phase 4 Universal Project-Level Architecture)
// AgriRoute / RuralFlow Universal Multilingual Logistics Intelligence Assistant

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, X, RefreshCw, Bot } from 'lucide-react';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import type { UserRole } from '../../services/api';
import type {
  ElaMessage as ElaMessageType,
  ElaConfirmationAction,
} from '../../services/elaApi';
import { sendElaChatMessage, confirmElaAction } from '../../services/elaApi';
import { useEla } from '../../context/ElaContext';
import { ElaMessage } from './ElaMessage';
import { ElaInput } from './ElaInput';
import { ElaSuggestions, getDefaultSuggestions } from './ElaSuggestions';
import { ElaContextBadge } from './ElaContextBadge';
import { ElaAgentStatus, type AgentLifecycleStage } from './ElaAgentStatus';
import { ElaVoiceVisualizer } from './ElaVoiceVisualizer';

interface ElaChatProps {
  onClose: () => void;
}

export const ElaChat: React.FC<ElaChatProps> = ({ onClose }) => {
  const { state, loadUserBusinessData } = useSharedContext();
  const { language, t } = useLanguage();
  const { isListening, isSpeaking, startVoiceInput, stopVoiceInput, speakResponse, stopSpeaking } = useEla();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authenticated context vs public landing context separation
  const isInsideDashboard = location.pathname.startsWith('/dashboards/');
  const authenticatedRole = state.auth.isAuthenticated && state.auth.user?.role ? state.auth.user.role : null;
  const currentUserName = isInsideDashboard && state.auth.user?.name ? state.auth.user.name : '';

  // Initial role is ONLY set from auth when inside an authenticated dashboard
  const initialRole: UserRole | 'GUEST' = isInsideDashboard && authenticatedRole ? authenticatedRole : 'GUEST';
  const [conversationalRole, setConversationalRole] = useState<UserRole | 'GUEST'>(initialRole);
  const [agentStage, setAgentStage] = useState<AgentLifecycleStage>('IDLE');
  const [agentStatusMsg, setAgentStatusMsg] = useState<string>('');

  const getInitialWelcomeMessage = useCallback((): ElaMessageType => {
    let welcomeText: string;

    if (conversationalRole === 'FARMER' && isInsideDashboard) {
      welcomeText =
        language === 'mr'
          ? `नमस्कार ${currentUserName || 'शेतकरी मित्र'}! मी ELA, तुमची अ‍ॅग्रीरूट लॉजिस्टिक्स सहाय्यक. मी पिके नोंदवणे, वाहतूक मागवणे किंवा डिलिव्हरी ट्रॅक करण्यात मदत करू शकते.`
          : language === 'hi'
          ? `नमस्ते ${currentUserName || 'किसान भाई'}! मैं ELA हूँ। अपनी फसल जोड़ने, गाड़ी बुक करने या डिलीवरी देखने के लिए मुझसे पूछें।`
          : `Hello ${currentUserName || 'Farmer'}! I'm ELA, your AgriRoute logistics assistant. I can help you list crops, request transport, or track deliveries.`;
    } else if (conversationalRole === 'BUYER' && isInsideDashboard) {
      welcomeText =
        language === 'mr'
          ? `नमस्कार ${currentUserName || 'व्यापारी मित्र'}! मी ELA. थेट शेतमाल शोधण्यासाठी किंवा खरेदी मागणी (Procurement) नोंदवण्यासाठी मी सज्ज आहे.`
          : language === 'hi'
          ? `नमस्ते ${currentUserName || 'व्यापारी जी'}! मैं ELA हूँ। किसानों से ताज़ा उपज खरीदने या खरीद मांग पोस्ट करने के लिए मुझसे कहें।`
          : `Hello ${currentUserName || 'Buyer'}! I'm ELA. I can assist you with discovering farm fresh produce, posting bulk procurement demands, and tracking orders.`;
    } else if (conversationalRole === 'TRANSPORTER' && isInsideDashboard) {
      welcomeText =
        language === 'mr'
          ? `नमस्कार ${currentUserName || 'वाहतूकदार मित्र'}! मी ELA. उपलब्ध फेऱ्या शोधणे, वाहने व्यवस्थापित करणे किंवा कमाई तपासण्यात मी मदत करू शकेन.`
          : language === 'hi'
          ? `नमस्ते ${currentUserName || 'ट्रांसपोर्टर जी'}! मैं ELA हूँ। उपलब्ध ट्रिप्स खोजने, गाड़ी प्रबंधन या कमाई देखने में मैं आपकी सहायता करूँगी।`
          : `Hello ${currentUserName || 'Transporter'}! I'm ELA. I can help you find available loads, manage vehicles, track trips, and view earnings.`;
    } else {
      // Universal Landing Welcome Message across all 7 Indian languages
      welcomeText =
        language === 'mr'
          ? 'नमस्कार! मी ELA — तुमची अ‍ॅग्रीरूट AI सहाय्यक. मी तुम्हाला शेतकरी, खरेदीदार किंवा वाहतूकदार पोर्टलमध्ये प्रवेश करण्यास, अ‍ॅग्रीरूट कसे कार्य करते ते समजून घेण्यास किंवा कार्ये पूर्ण करण्यास मदत करू शकते.'
          : language === 'hi'
          ? 'नमस्ते! मैं ELA हूँ — आपकी एग्रीरूट Universal Intelligence Assistant। मैं आपको किसान, खरीदार या ट्रांसपोर्टर पोर्टल में प्रवेश करने, एग्रीरूट कैसे काम करता है यह समझने, या काम पूरे करने में मदद कर सकती हूँ।'
          : language === 'ta'
          ? 'வணக்கம்! நான் ELA, உங்கள் அக்ரிரூட் AI உதவியாளர். விவசாயி, வாங்குபவர் அல்லது டிரான்ஸ்போர்ட்டர் போர்ட்டலை அணுகவும், அக்ரிரூட் எவ்வாறு செயல்படுகிறது என்பதைப் புரிந்து கொள்ளவும் நான் உதவ முடியும்.'
          : language === 'te'
          ? 'నమస్కారం! నేను ELA, మీ అగ్రిరూట్ AI సహాయకురాలిని. రైతు, కొనుగోలుదారు లేదా రవాణాదారు పోర్టల్‌ను యాక్సెస్ చేయడానికి, అగ్రిరూట్ ఎలా పనిచేస్తుందో అర్థం చేసుకోవడానికి నేను సహాయం చేయగలను.'
          : language === 'bn'
          ? 'নমস্কার! আমি ELA, আপনার অ্যাগ্রিরুট AI সহকারী। আমি আপনাকে কৃষক, ক্রেতা বা পরিবহনকারী পোর্টালে প্রবেশ করতে, অ্যাগ্রিরুট কীভাবে কাজ করে তা বুঝতে সাহায্য করতে পারি।'
          : language === 'kn'
          ? 'ನಮಸ್ಕಾರ! ನಾನು ELA, ನಿಮ್ಮ ಅಗ್ರಿರೌಟ್ AI ಸಹಾಯಕ. ರೈತ, ಖರೀದಿದಾರ ಅಥವಾ ಸಾರಿಗೆದಾರ ಪೋರ್ಟಲ್ ಅನ್ನು ಪ್ರವೇಶಿಸಲು, ಅಗ್ರಿರೌಟ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.'
          : "Hello! I'm ELA, your AgriRoute Universal Intelligence Assistant. मैं Farmer, Buyer या Transporter portal में आपकी मदद कर सकती हूँ. How can I help you today?";
    }

    return {
      id: 'welcome-msg',
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date().toISOString(),
      suggestions: getDefaultSuggestions(conversationalRole, language),
    };
  }, [conversationalRole, isInsideDashboard, currentUserName, language]);

  const storageKey = isInsideDashboard && state.auth.user
    ? `ruralflow_ela_chat_${state.auth.user.id}_${state.auth.user.role}`
    : 'ruralflow_ela_chat_universal';

  const [messages, setMessages] = useState<ElaMessageType[]>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
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
    getDefaultSuggestions(conversationalRole, language)
  );

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, agentStage]);

  // Persist conversation in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Storage unavailable
    }
  }, [messages, storageKey]);

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
          'Please enter your password or OTP directly into the secure login form. For your protection, ELA never processes, stores, or transmits authentication secrets.',
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
    setAgentStage('UNDERSTANDING');
    setAgentStatusMsg('Understanding semantic intent & entities...');

    try {
      const historyPayload = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // Lifecycle progression
      setTimeout(() => {
        setAgentStage('PLANNING');
        setAgentStatusMsg('Planning tasks & checking resources...');
      }, 300);

      const response = await sendElaChatMessage(trimmed, historyPayload, {
        role: conversationalRole,
        language,
        currentPage: location.pathname,
        userName: currentUserName,
      });

      // Dynamically update conversational role if detected from natural language
      if (response.detectedRole && response.detectedRole !== 'GUEST') {
        const detected = response.detectedRole as UserRole;
        setConversationalRole(detected);
      }

      if (response.confirmationAction) {
        setAgentStage('WAITING_FOR_CONFIRMATION');
        setAgentStatusMsg('Action staged — awaiting confirmation...');
      } else {
        setAgentStage('COMPLETED');
      }

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
      } else if (response.detectedRole) {
        setCurrentSuggestions(getDefaultSuggestions(response.detectedRole as UserRole | 'GUEST', language));
      }

      // If navigation action present (e.g. login routing)
      if (response.navigationAction?.route) {
        setTimeout(() => {
          navigate(response.navigationAction!.route);
        }, 1200);
      }

      // Voice synthesis response if user used voice or TTS active
      if (isSpeaking) {
        speakResponse(response.message);
      }
    } catch (error) {
      setAgentStage('ERROR');
      setAgentStatusMsg('Failed to process message.');
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
      setTimeout(() => {
        if (agentStage !== 'WAITING_FOR_CONFIRMATION') {
          setAgentStage('IDLE');
        }
      }, 2000);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoiceInput();
      setAgentStage('IDLE');
    } else {
      setAgentStage('LISTENING');
      setAgentStatusMsg('Listening to your voice...');
      startVoiceInput((transcript) => {
        setAgentStage('TRANSCRIBING');
        setAgentStatusMsg('Transcribing voice input...');
        handleSendMessage(transcript);
      });
    }
  };

  const handleConfirmAction = async (action: ElaConfirmationAction) => {
    setAgentStage('EXECUTING');
    setAgentStatusMsg('Executing authorized transaction on application backend...');
    try {
      const result = await confirmElaAction({
        actionId: action.actionId,
        toolName: action.toolName,
        params: action.params,
        confirmed: true,
        language,
      });

      setAgentStage('VERIFYING');
      setAgentStatusMsg('Verifying database state & goal completion...');

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
      setAgentStage('COMPLETED');
    } catch (err) {
      setAgentStage('ERROR');
      setAgentStatusMsg('Action execution failed.');
      const errorMsg: ElaMessageType = {
        id: `confirm-err-${Date.now()}`,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Action execution failed.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setTimeout(() => setAgentStage('IDLE'), 2000);
    }
  };

  const handleCancelAction = (action: ElaConfirmationAction) => {
    const cancelMsg: ElaMessageType = {
      id: `cancel-${Date.now()}`,
      role: 'assistant',
      content: `Cancelled ${action.title}. How else can I assist you?`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, cancelMsg]);
    setAgentStage('IDLE');
  };

  const handleClearChat = () => {
    sessionStorage.removeItem(storageKey);
    setConversationalRole(initialRole);
    setMessages([getInitialWelcomeMessage()]);
    setCurrentSuggestions(getDefaultSuggestions(initialRole, language));
    setAgentStage('IDLE');
  };

  return (
    <div className="w-[380px] sm:w-[430px] h-[600px] max-h-[85vh] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans">
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
              AgriRoute Universal AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ElaVoiceVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            onToggleListening={handleVoiceToggle}
            onStopSpeaking={stopSpeaking}
          />

          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role & Context State Badge */}
      <ElaContextBadge role={conversationalRole} isAuthenticated={Boolean(state.auth.isAuthenticated && isInsideDashboard)} />

      {/* Real Agent Lifecycle Status Banner */}
      {agentStage !== 'IDLE' && (
        <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800">
          <ElaAgentStatus stage={agentStage} customMessage={agentStatusMsg} />
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-950/60">
        {messages.map((msg) => (
          <ElaMessage
            key={msg.id}
            message={msg}
            onConfirmAction={handleConfirmAction}
            onCancelAction={handleCancelAction}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Contextual Suggestions Carousel */}
      <div className="shrink-0 bg-slate-900/60 border-t border-slate-800/80">
        <ElaSuggestions
          suggestions={currentSuggestions}
          onSelectSuggestion={handleSendMessage}
          disabled={isLoading || isListening}
        />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 shrink-0">
        <ElaInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading || isListening}
          autoFocus={false}
        />
      </div>
    </div>
  );
};
