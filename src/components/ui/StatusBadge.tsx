import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showDot = true,
}) => {
  const { t } = useLanguage();
  const normalized = status.toLowerCase();
  const statusKey = `status.${normalized.replace(/\s+/g, '_')}`;
  const displayStatus = t(statusKey) || status;

  let style = 'bg-gray-100 text-gray-700 border-gray-200';
  let isLive = false;
  let dotColor = 'bg-gray-400';

  if (normalized === 'completed' || normalized === 'delivered') {
    style = 'bg-[#E8F5E9] text-[#2E7D32] border-green-200';
    dotColor = 'bg-[#2E7D32]';
  } else if (normalized === 'in transit') {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
    isLive = true;
    dotColor = 'bg-blue-500';
  } else if (normalized === 'assigned' || normalized === 'fulfilling') {
    style = 'bg-amber-50 text-amber-800 border-amber-200';
    isLive = true;
    dotColor = 'bg-amber-500';
  } else if (
    normalized === 'searching' ||
    normalized === 'logistics requested' ||
    normalized === 'open'
  ) {
    style = 'bg-amber-50 text-amber-900 border-amber-200/80';
    isLive = true;
    dotColor = 'bg-amber-500';
  } else if (normalized === 'available' || normalized === 'verified') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors shadow-2xs ${style} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {isLive && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
      )}
      <span>{displayStatus}</span>
    </span>
  );
};
