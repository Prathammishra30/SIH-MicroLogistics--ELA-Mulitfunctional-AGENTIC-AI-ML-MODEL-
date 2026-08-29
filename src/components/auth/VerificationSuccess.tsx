import React, { useEffect } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../../context/LanguageContext";

interface VerificationSuccessProps {
  roleTitle: string;
  dashboardRoute: string;
  accentColor?: string;
}

export const VerificationSuccess: React.FC<VerificationSuccessProps> = ({
  roleTitle,
  dashboardRoute,
  accentColor = '#2E7D32',
}) => {
    const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(dashboardRoute);
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate, dashboardRoute]);

  return (
    <div className="text-center py-8 space-y-6 max-w-md mx-auto">
      {/* Check Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm"
        style={{ backgroundColor: `${accentColor}15`, border: `2px solid ${accentColor}` }}
      >
        <Check className="w-8 h-8" style={{ color: accentColor }} />
      </div>

      {/* Success Text */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {t('auth.common._verification_successful')}</h2>
        <p className="text-sm text-gray-600">
          {t('auth.common.welcome_to_ruralflow')}<strong className="text-gray-900">{roleTitle}</strong>.
        </p>
        <p className="text-xs text-gray-400">
          {t('auth.common.redirecting_to_your_dashboard')}</p>
      </div>

      {/* Action */}
      <button
        type="button"
        onClick={() => navigate(dashboardRoute)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#2E7D32] hover:underline transition-colors pt-2 cursor-pointer"
      >
        <span>{t('auth.common.enter_dashboard_now')}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
