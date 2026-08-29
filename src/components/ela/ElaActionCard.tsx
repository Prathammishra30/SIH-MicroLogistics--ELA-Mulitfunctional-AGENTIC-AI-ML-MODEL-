// ELA Action Card Component
// RuralFlow Action Result & Safe Navigation Cards

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { ElaNavigationAction } from '../../services/elaApi';
import { useLanguage } from '../../context/LanguageContext';

interface ElaActionCardProps {
  navigationAction: ElaNavigationAction;
  onNavigate?: () => void;
}

export const ElaActionCard: React.FC<ElaActionCardProps> = ({
  navigationAction,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleActionClick = () => {
    if (navigationAction.route) {
      navigate(navigationAction.route);
      if (onNavigate) {
        onNavigate();
      }
    }
  };

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-linear-to-br from-[#E8F5E9]/90 to-[#F1F8E9] border border-green-200/80 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <Compass className="w-5 h-5 animate-spin-slow" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B5E20]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span>{t('ela.navigating') || 'Navigating to'}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
            {navigationAction.label}
          </h4>
          {navigationAction.description && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              {navigationAction.description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-semibold shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>{t('ela.navigateNow') || 'Go to Page'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-500 bg-white/70 px-2 py-1 rounded-lg border border-green-100">
              {navigationAction.route}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
