import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, type LucideIcon } from 'lucide-react';
import { SecurityBadge } from './SecurityBadge';
import { useLanguage } from '../../context/LanguageContext';
import { SiteFooter } from '../ui/SiteFooter';

interface AuthBenefit {
  title: string;
  desc?: string;
}

interface AuthLayoutProps {
  roleName: string;
  roleIcon: LucideIcon;
  headline: string;
  supportingText: string;
  benefits: AuthBenefit[];
  accentColorHex: string;
  accentBorderClass: string;
  accentBgClass: string;
  accentTextClass: string;
  roleAccessText?: string;
  imageUrl?: string;
  imageAlt?: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  roleName,
  roleIcon: RoleIcon,
  headline,
  supportingText,
  benefits,
  accentBorderClass,
  accentBgClass,
  accentTextClass,
  roleAccessText,
  imageUrl,
  imageAlt,
  children,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative z-10 bg-[#F8FAF8]">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1">
        {/* LEFT COLUMN: Role Brand & Value Proposition */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('action.cancel')}</span>
            </button>

            {/* Role Badge */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 border ${accentBgClass} ${accentBorderClass}`}
              >
                <RoleIcon className={`w-4 h-4 ${accentTextClass}`} />
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${accentTextClass}`}
                >
                  {roleName}
                </span>
              </div>
            </div>
          </div>

          {imageUrl && (
            <div className="w-full h-40 sm:h-48 lg:h-56 rounded-2xl overflow-hidden border border-gray-200 shadow-xs relative">
              <img
                src={imageUrl}
                alt={imageAlt || roleName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
            </div>
          )}

          {/* Main Slogan & Headline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {headline}
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed font-normal">
              {supportingText}
            </p>
          </div>

          {/* 3 Key Benefits */}
          <div className="space-y-2.5 pt-2">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-200 shadow-2xs"
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${accentTextClass}`}
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 block">
                    {b.title}
                  </span>
                  {b.desc && (
                    <span className="text-xs text-gray-500 block mt-0.5">
                      {b.desc}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Trust Footnote */}
          <div className="text-[11px] text-gray-500 flex items-center gap-2 pt-2">
            <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
            <span>{t('auth.common.smart_india_hackathon_verified')}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Card Container */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 shadow-xs">
            {/* Dynamic Content (Login / OTP / Register / Success) */}
            {children}

            {/* Security Trust Badges */}
            <SecurityBadge roleText={roleAccessText} />
          </div>
        </div>
      </div>

      {/* Footer Image Gallery & Verification Meta */}
      <div className="w-full max-w-5xl mx-auto pt-8">
        <SiteFooter compact />
      </div>
    </div>
  );
};
