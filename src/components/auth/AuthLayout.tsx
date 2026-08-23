import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, type LucideIcon } from 'lucide-react';
import { SecurityBadge } from './SecurityBadge';

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
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  roleName,
  roleIcon: RoleIcon,
  headline,
  supportingText,
  benefits,
  accentColorHex,
  accentBorderClass,
  accentBgClass,
  accentTextClass,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative z-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: Role Brand & Value Proposition */}
        <div className="lg:col-span-5 space-y-6 text-left">
          
          {/* Back to Gateway Link */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Gateway</span>
          </button>

          {/* Role Badge */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${accentBgClass} ${accentBorderClass}`}>
              <RoleIcon className={`w-6 h-6 ${accentTextClass}`} />
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${accentTextClass}`}>
                {roleName} Portal
              </span>
              <h2 className="text-sm font-semibold text-slate-300">RuralFlow Micro-Logistics</h2>
            </div>
          </div>

          {/* Main Slogan & Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {headline}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {supportingText}
            </p>
          </div>

          {/* 3 Key Benefits */}
          <div className="space-y-3 pt-2">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${accentTextClass}`} />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-white block">
                    {b.title}
                  </span>
                  {b.desc && (
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {b.desc}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Trust Footnote */}
          <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-2">
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColorHex }} />
            <span>Smart India Hackathon • Verified Micro-Logistics Node</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Card Container */}
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl overflow-hidden">
            {/* Top accent glow line */}
            <div
              className="absolute top-0 left-0 right-0 h-1 opacity-75"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColorHex}, transparent)`,
              }}
            />

            {/* Dynamic Content (Login / OTP / Register / Success) */}
            {children}

            {/* Security Trust Badges */}
            <SecurityBadge roleText={`${roleName} Access`} />
          </div>
        </div>
      </div>
    </div>
  );
};
