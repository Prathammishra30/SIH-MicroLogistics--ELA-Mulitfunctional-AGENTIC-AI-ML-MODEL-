import React from 'react';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SecurityBadgeProps {
  roleText?: string;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  roleText,
}) => {
  const { t } = useLanguage();
  const displayRoleText = roleText || t('auth.security.role_access') || 'Role-Based Access Control';

  return (
    <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
        <span>{t('auth.security.encrypted_session') || 'Encrypted Session'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Lock className="w-3 h-3 text-gray-400" />
        <span>{displayRoleText}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-amber-600" />
        <span>{t('auth.security.sih_protocol') || 'SIH Protocol'}</span>
      </div>
    </div>
  );
};
