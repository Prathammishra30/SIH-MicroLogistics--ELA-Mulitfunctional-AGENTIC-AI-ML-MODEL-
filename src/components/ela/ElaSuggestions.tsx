// ELA Suggestions Component
// Quick contextual prompt suggestions for Farmers, Buyers, and Transporters

import React from 'react';
import { Sparkles } from 'lucide-react';

interface ElaSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  disabled?: boolean;
}

export const ElaSuggestions: React.FC<ElaSuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
  disabled = false,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-x">
      <div className="flex items-center gap-1.5 shrink-0 text-slate-400 text-xs font-medium pl-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      </div>
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {suggestions.map((suggestion, idx) => (
          <button
            key={`${suggestion}-${idx}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(suggestion)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-[#E8F5E9] text-slate-700 hover:text-[#1B5E20] border border-slate-200/80 hover:border-green-300 shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
