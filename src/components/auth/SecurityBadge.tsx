import React from 'react';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';

interface SecurityBadgeProps {
  roleText?: string;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  roleText = 'Role-Based Access Control',
}) => {
  return (
    <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>256-Bit Encrypted Session</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Lock className="w-3 h-3 text-slate-400" />
        <span>{roleText}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>SIH Logistics Protocol</span>
      </div>
    </div>
  );
};
