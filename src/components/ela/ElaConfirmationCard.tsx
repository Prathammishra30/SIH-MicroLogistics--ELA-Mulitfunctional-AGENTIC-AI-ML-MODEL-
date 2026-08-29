// ELA Confirmation Card Component
// Consequential Action User Confirmation UI

import React, { useState } from 'react';
import { ShieldCheck, Check, X, Loader2 } from 'lucide-react';
import type { ElaConfirmationAction } from '../../services/elaApi';
import { useLanguage } from '../../context/LanguageContext';

interface ElaConfirmationCardProps {
  confirmationAction: ElaConfirmationAction;
  onConfirm: (action: ElaConfirmationAction) => Promise<void>;
  onCancel: (action: ElaConfirmationAction) => void;
}

export const ElaConfirmationCard: React.FC<ElaConfirmationCardProps> = ({
  confirmationAction,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');

  const handleConfirmClick = async () => {
    if (isSubmitting || status !== 'pending') return;
    setIsSubmitting(true);
    try {
      await onConfirm(confirmationAction);
      setStatus('confirmed');
    } catch {
      // Keep state open if failed
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (isSubmitting || status !== 'pending') return;
    setStatus('cancelled');
    onCancel(confirmationAction);
  };

  const paramEntries = Object.entries(confirmationAction.params).filter(
    ([key]) => !['actionId', 'toolName'].includes(key)
  );

  return (
    <div className="mt-3 p-4 rounded-2xl bg-linear-to-br from-amber-500/10 via-emerald-500/10 to-green-500/15 border-2 border-emerald-500/30 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2 text-emerald-900 pb-2 border-b border-emerald-500/20">
        <div className="w-8 h-8 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shadow-xs shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            {t('ela.confirmationRequired') || 'Confirmation Required'}
          </span>
          <h4 className="text-sm font-bold text-slate-900 truncate">
            {confirmationAction.title}
          </h4>
        </div>
      </div>

      {/* Summary */}
      {confirmationAction.summary && (
        <p className="text-xs text-slate-700 font-medium mt-2.5 leading-relaxed">
          {confirmationAction.summary}
        </p>
      )}

      {/* Param details table */}
      {paramEntries.length > 0 && (
        <div className="mt-3 bg-white/80 backdrop-blur-xs rounded-xl p-2.5 border border-emerald-200/60 text-xs space-y-1.5 font-sans">
          {paramEntries.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-slate-700 py-0.5">
              <span className="text-slate-500 font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1')}:
              </span>
              <span className="font-semibold text-slate-900 text-right truncate max-w-[60%]">
                {String(val)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3.5 flex items-center gap-2">
        {status === 'pending' ? (
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmClick}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('ela.confirming') || 'Confirming...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{confirmationAction.confirmLabel || t('ela.confirmAction') || 'Confirm Action'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCancelClick}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : status === 'confirmed' ? (
          <div className="w-full py-1.5 px-3 bg-emerald-100 text-[#1B5E20] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-300">
            <Check className="w-4 h-4" />
            <span>{t('ela.actionConfirmed') || 'Action Confirmed'}</span>
          </div>
        ) : (
          <div className="w-full py-1.5 px-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-300">
            <X className="w-4 h-4" />
            <span>{t('ela.actionCancelled') || 'Action Cancelled'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
