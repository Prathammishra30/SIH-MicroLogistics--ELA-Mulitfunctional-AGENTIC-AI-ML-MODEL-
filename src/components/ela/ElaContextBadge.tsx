// ELA Context & Role Badge Component
// Displays Universal vs Dynamic Domain Role (Farmer / Buyer / Transporter)
// Rule: ONE ELA Assistant. Never display "Farmer AI", "Buyer AI", or "Transporter AI".

import React from 'react';
import { Sparkles, Shield, User, ShoppingCart, Truck, Bot } from 'lucide-react';
import type { UserRole } from '../../services/api';

interface ElaContextBadgeProps {
  role: UserRole | 'GUEST';
  isAuthenticated?: boolean;
}

export const ElaContextBadge: React.FC<ElaContextBadgeProps> = ({ role, isAuthenticated = false }) => {
  let roleLabel = 'Universal AI Assistant';
  let statusText = 'Online • Universal';
  let IconComponent = Bot;
  let dotColor = 'bg-emerald-400';

  if (role === 'FARMER') {
    roleLabel = 'Farmer Domain';
    statusText = isAuthenticated ? 'Online • Farmer (Auth)' : 'Online • Farmer';
    IconComponent = User;
    dotColor = 'bg-green-400';
  } else if (role === 'BUYER') {
    roleLabel = 'Buyer Domain';
    statusText = isAuthenticated ? 'Online • Buyer (Auth)' : 'Online • Buyer';
    IconComponent = ShoppingCart;
    dotColor = 'bg-blue-400';
  } else if (role === 'TRANSPORTER') {
    roleLabel = 'Transporter Domain';
    statusText = isAuthenticated ? 'Online • Transporter (Auth)' : 'Online • Transporter';
    IconComponent = Truck;
    dotColor = 'bg-amber-400';
  }

  return (
    <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/80 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
          <IconComponent className="w-4 h-4" />
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${dotColor}`} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-white tracking-wide flex items-center gap-1">
              ELA <Sparkles className="w-3 h-3 text-amber-400 inline animate-pulse" />
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border bg-slate-800/80 border-slate-700 text-slate-300">
              {roleLabel}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-tight flex items-center gap-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} animate-ping`} />
            {statusText}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 px-2 py-1 rounded-md border border-slate-700/50">
        <Shield className="w-3 h-3 text-emerald-400" />
        <span>RBAC Active</span>
      </div>
    </div>
  );
};
