import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FooterGallery } from './FooterGallery';

interface SiteFooterProps {
  className?: string;
  showGallery?: boolean;
  compact?: boolean;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  className = '',
  showGallery = true,
  compact = false,
}) => {
  const { t } = useLanguage();

  return (
    <footer
      className={`mt-12 pt-8 border-t border-[#E5E8E2] w-full text-xs text-[#66706A] ${className}`}
    >
      {/* 1. Center Footer Image Gallery */}
      {showGallery && <FooterGallery className={compact ? 'py-3' : 'py-5'} />}

      {/* 2. Footer Metadata & Verification Tags */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
          <span className="font-bold text-[#17211B]">AgriRoute</span>
          <span>•</span>
          <span>{t('gateway.footer.1') || 'Smart India Hackathon'}</span>
          <span>•</span>
          <span>{t('gateway.footer.2') || 'Optimized Rural Micro-Logistics'}</span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-xs text-[#66706A]">
          <span>{t('gateway.footer.3') || 'PostgreSQL Secured'}</span>
          <span>•</span>
          <span>{t('gateway.footer.4') || 'Direct Farm-Gate Integration'}</span>
        </div>
      </div>
    </footer>
  );
};
