import React from 'react';

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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          className="p-3.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-2 group text-center cursor-pointer"
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${action.colorClass}`}
          >
            {action.icon}
          </div>
          <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
};
