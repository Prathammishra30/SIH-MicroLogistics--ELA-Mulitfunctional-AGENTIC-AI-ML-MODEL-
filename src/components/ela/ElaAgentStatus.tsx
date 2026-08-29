// ELA Agent Lifecycle Status Component
// Displays real-time agent progression states: UNDERSTANDING -> PLANNING -> EXECUTING -> VERIFYING -> COMPLETED

import React from 'react';
import { Brain, Cpu, Truck, DollarSign, CheckCircle2, AlertCircle, Mic, Volume2, Loader2 } from 'lucide-react';

export type AgentLifecycleStage =
  | 'IDLE'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'UNDERSTANDING'
  | 'PLANNING'
  | 'CHECKING'
  | 'CALCULATING'
  | 'WAITING_FOR_CONFIRMATION'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'SPEAKING'
  | 'COMPLETED'
  | 'ERROR';

interface ElaAgentStatusProps {
  stage: AgentLifecycleStage;
  customMessage?: string;
}

export const ElaAgentStatus: React.FC<ElaAgentStatusProps> = ({ stage, customMessage }) => {
  if (stage === 'IDLE' || stage === 'COMPLETED') {
    return null;
  }

  let icon = <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />;
  let label = 'Processing request...';
  let badgeColor = 'bg-slate-800/90 text-emerald-300 border-emerald-500/30';

  switch (stage) {
    case 'LISTENING':
      icon = <Mic className="w-3.5 h-3.5 text-rose-400 animate-bounce" />;
      label = 'Listening to voice input...';
      badgeColor = 'bg-rose-950/60 text-rose-300 border-rose-500/40';
      break;
    case 'TRANSCRIBING':
      icon = <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" />;
      label = 'Transcribing speech audio...';
      badgeColor = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
      break;
    case 'UNDERSTANDING':
      icon = <Brain className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />;
      label = 'Understanding semantic intent...';
      badgeColor = 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40';
      break;
    case 'PLANNING':
      icon = <Cpu className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
      label = 'Planning task & goal decomposition...';
      badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
      break;
    case 'CHECKING':
      icon = <Truck className="w-3.5 h-3.5 text-blue-400 animate-bounce" />;
      label = 'Checking available transport & capacity...';
      badgeColor = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
      break;
    case 'CALCULATING':
      icon = <DollarSign className="w-3.5 h-3.5 text-green-400 animate-pulse" />;
      label = 'Running ML price & transit ETA prediction...';
      badgeColor = 'bg-green-950/60 text-green-300 border-green-500/40';
      break;
    case 'WAITING_FOR_CONFIRMATION':
      icon = <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
      label = 'Awaiting your confirmation to execute...';
      badgeColor = 'bg-amber-950/70 text-amber-200 border-amber-500/50';
      break;
    case 'EXECUTING':
      icon = <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />;
      label = 'Executing authorized database transaction...';
      badgeColor = 'bg-emerald-950/70 text-emerald-200 border-emerald-500/50';
      break;
    case 'VERIFYING':
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 animate-pulse" />;
      label = 'Verifying database state & goal completion...';
      badgeColor = 'bg-teal-950/70 text-teal-200 border-teal-500/50';
      break;
    case 'SPEAKING':
      icon = <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />;
      label = 'Synthesizing voice response...';
      badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
      break;
    case 'ERROR':
      icon = <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      label = 'Execution failure — planning recovery options...';
      badgeColor = 'bg-rose-950/70 text-rose-200 border-rose-500/50';
      break;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md shadow-sm transition-all duration-300 ${badgeColor}`}>
      {icon}
      <span className="truncate">{customMessage || label}</span>
    </div>
  );
};
