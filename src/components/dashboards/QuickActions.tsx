import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action, idx) => (
        <motion.button
          key={action.id}
          onClick={action.onClick}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.35,
            delay: shouldReduceMotion ? 0 : idx * 0.05,
          }}
          whileHover={
            shouldReduceMotion
              ? undefined
              : { y: -3, scale: 1.02, transition: { duration: 0.15 } }
          }
          whileTap={
            shouldReduceMotion
              ? undefined
              : { scale: 0.97, transition: { duration: 0.1 } }
          }
          className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-gray-300 shadow-xs hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2.5 group text-center cursor-pointer"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs ${action.colorClass}`}
          >
            {action.icon}
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
