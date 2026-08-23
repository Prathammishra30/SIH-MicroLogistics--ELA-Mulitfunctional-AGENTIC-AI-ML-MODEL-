import React from 'react';
import { motion } from 'framer-motion';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  colorClass: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {actions.map((action, idx) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          onClick={action.onClick}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center gap-2 group text-center"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${action.colorClass}`}>
            {action.icon}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
