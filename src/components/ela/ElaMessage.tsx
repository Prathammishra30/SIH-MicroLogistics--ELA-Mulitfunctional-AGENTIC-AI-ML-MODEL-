// ELA Message Component
// User & Assistant Chat Bubbles with Rich Card Rendering

import React from 'react';
import { Bot, User as UserIcon, AlertCircle } from 'lucide-react';
import type { ElaMessage as ElaMessageType } from '../../services/elaApi';
import { ElaActionCard } from './ElaActionCard';

interface ElaMessageProps {
  message: ElaMessageType;
  onNavigate?: () => void;
}

export const ElaMessage: React.FC<ElaMessageProps> = ({ message, onNavigate }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

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
        className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${
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
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {/* Action Card if navigation was returned */}
          {!isUser && message.navigationAction && (
            <ElaActionCard
              navigationAction={message.navigationAction}
              onNavigate={onNavigate}
            />
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
          {formattedTime}
        </span>
      </div>
    </div>
  );
};
