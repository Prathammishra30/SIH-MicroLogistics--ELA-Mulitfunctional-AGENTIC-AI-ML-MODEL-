// ELA Message Component
// User & Assistant Chat Bubbles with Rich Card, Confirmation, Markdown Rendering, Voice Synthesis & Feedback Telemetry

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User as UserIcon, AlertCircle, Volume2, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ElaMessage as ElaMessageType, ElaConfirmationAction } from '../../services/elaApi';
import { ElaActionCard } from './ElaActionCard';
import { ElaConfirmationCard } from './ElaConfirmationCard';
import { useEla } from '../../context/ElaContext';

interface ElaMessageProps {
  message: ElaMessageType;
  onNavigate?: () => void;
  onConfirmAction?: (action: ElaConfirmationAction) => Promise<void>;
  onCancelAction?: (action: ElaConfirmationAction) => void;
}

export const ElaMessage: React.FC<ElaMessageProps> = ({
  message,
  onNavigate,
  onConfirmAction,
  onCancelAction,
}) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const { speakResponse, submitFeedback } = useEla();
  const [feedbackGiven, setFeedbackGiven] = useState<'POSITIVE' | 'NEGATIVE' | null>(null);

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleFeedback = (rating: 'POSITIVE' | 'NEGATIVE') => {
    if (feedbackGiven) return;
    setFeedbackGiven(rating);
    submitFeedback(rating, message.content.slice(0, 150));
  };

  return (
    <div
      className={`flex items-start gap-2.5 my-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-xs font-bold ${
          isUser
            ? 'bg-slate-800 text-white'
            : isError
            ? 'bg-rose-100 text-rose-700 border border-rose-200'
            : 'bg-linear-to-br from-[#2E7D32] to-[#1B5E20] text-white shadow-green-900/20'
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[82%] flex flex-col ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-[#1B5E20] text-white rounded-tr-xs shadow-xs'
              : isError
              ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs'
              : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-xs'
          }`}
        >
          {/* Render markdown for assistant messages, plain text for user messages */}
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <div className="ela-markdown break-words [&_p]:my-1 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:my-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:my-1 [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_a]:text-emerald-600 [&_a]:underline">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}

          {/* Action Card if navigation was returned */}
          {!isUser && message.navigationAction && (
            <ElaActionCard
              navigationAction={message.navigationAction}
              onNavigate={onNavigate}
            />
          )}

          {/* Confirmation Card if consequential action requires confirmation */}
          {!isUser && message.confirmationAction && onConfirmAction && onCancelAction && (
            <ElaConfirmationCard
              confirmationAction={message.confirmationAction}
              onConfirm={onConfirmAction}
              onCancel={onCancelAction}
            />
          )}
        </div>

        {/* Message Footer: Timestamp, Voice TTS, Feedback */}
        <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
          <span className="font-mono">{formattedTime}</span>

          {!isUser && !isError && (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={() => speakResponse(message.content)}
                title="Listen to message"
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleFeedback('POSITIVE')}
                title="Good response"
                className={`hover:text-emerald-700 transition-colors cursor-pointer ${
                  feedbackGiven === 'POSITIVE' ? 'text-emerald-600' : ''
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => handleFeedback('NEGATIVE')}
                title="Needs improvement"
                className={`hover:text-rose-600 transition-colors cursor-pointer ${
                  feedbackGiven === 'NEGATIVE' ? 'text-rose-600' : ''
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
