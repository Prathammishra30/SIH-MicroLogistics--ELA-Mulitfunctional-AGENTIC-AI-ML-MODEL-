import React from 'react';
import {
  Sprout,
  Users,
  Truck,
  Package,
  CheckCircle2,
  TrendingUp,
  Layers,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { HeroSection } from '../components/HeroSection';
import { RoleCard } from '../components/RoleCard';
import type { RoleCardData } from '../components/RoleCard';
import { useLanguage } from '../context/LanguageContext';

export const Gateway: React.FC = () => {
  const { t } = useLanguage();

  const ROLE_CARDS: RoleCardData[] = [
    {
      id: 'farmer',
      title: t('gateway.role.farmer.title'),
      badgeTitle: t('gateway.role.farmer.badge'),
      description: t('gateway.role.farmer.desc'),
      ctaText: t('gateway.role.farmer.cta'),
      route: '/auth/farmer',
      imageSrc: '/images/farmer-seedling.jpg',
      imageAlt: 'Caring farmer hands holding dark soil with green crop seedling',
      accentColor: {
        primary: '#2E7D32',
        cardBg: 'bg-white',
        border: 'border-[#E5E8E2]',
        borderHover: 'hover:border-[#2E7D32]/40',
        badgeBg: 'bg-[#EAF5E8]',
        badgeIconBg: 'bg-[#2E7D32]',
        badgeText: 'text-[#2E7D32]',
        btnBorder: 'border-[#2E7D32]',
        btnText: 'text-[#2E7D32]',
        btnHoverBg: 'hover:bg-[#EAF5E8]',
        gradientBg: 'bg-gradient-to-br from-green-50/80 to-[#EAF5E8]',
      },
    },
    {
      id: 'buyer',
      title: t('gateway.role.buyer.title'),
      badgeTitle: t('gateway.role.buyer.badge'),
      description: t('gateway.role.buyer.desc'),
      ctaText: t('gateway.role.buyer.cta'),
      route: '/auth/buyer',
      imageSrc: '/images/buyer-produce.jpg',
      imageAlt: 'Basket with colorful fresh organic vegetables and fruits',
      accentColor: {
        primary: '#2474B5',
        cardBg: 'bg-white',
        border: 'border-[#E5E8E2]',
        borderHover: 'hover:border-[#2474B5]/40',
        badgeBg: 'bg-[#EAF3FB]',
        badgeIconBg: 'bg-[#2474B5]',
        badgeText: 'text-[#2474B5]',
        btnBorder: 'border-[#2474B5]',
        btnText: 'text-[#2474B5]',
        btnHoverBg: 'hover:bg-[#EAF3FB]',
        gradientBg: 'bg-gradient-to-br from-white to-[#EAF3FB]',
      },
    },
    {
      id: 'transporter',
      title: t('gateway.role.transporter.title'),
      badgeTitle: t('gateway.role.transporter.badge'),
      description: t('gateway.role.transporter.desc'),
      ctaText: t('gateway.role.transporter.cta'),
      route: '/auth/transporter',
      imageSrc: '/images/transporter-truck.jpg',
      imageAlt: 'Modern freight truck driving on rural road with green hills',
      accentColor: {
        primary: '#E67E22',
        cardBg: 'bg-white',
        border: 'border-[#E5E8E2]',
        borderHover: 'hover:border-[#E67E22]/40',
        badgeBg: 'bg-[#FFF1E5]',
        badgeIconBg: 'bg-[#E67E22]',
        badgeText: 'text-[#E67E22]',
        btnBorder: 'border-[#E67E22]',
        btnText: 'text-[#E67E22]',
        btnHoverBg: 'hover:bg-[#FFF1E5]',
        gradientBg: 'bg-gradient-to-br from-white to-[#FFF1E5]',
      },
    },
  ];

  const HOW_IT_WORKS_STEPS = [
    {
      stepNum: 1,
      numColor: 'bg-[#2E7D32]',
      iconBg: 'bg-[#EAF5E8]',
      icon: <Sprout className="w-5 h-5 text-[#2E7D32]" />,
      title: t('gateway.how.1.title'),
      titleColor: 'text-[#2E7D32]',
      description: t('gateway.how.1.desc'),
    },
    {
      stepNum: 2,
      numColor: 'bg-[#2474B5]',
      iconBg: 'bg-[#EAF3FB]',
      icon: <Users className="w-5 h-5 text-[#2474B5]" />,
      title: t('gateway.how.2.title'),
      titleColor: 'text-[#2474B5]',
      description: t('gateway.how.2.desc'),
    },
    {
      stepNum: 3,
      numColor: 'bg-[#E67E22]',
      iconBg: 'bg-[#FFF1E5]',
      icon: <Truck className="w-5 h-5 text-[#E67E22]" />,
      title: t('gateway.how.3.title'),
      titleColor: 'text-[#E67E22]',
      description: t('gateway.how.3.desc'),
    },
    {
      stepNum: 4,
      numColor: 'bg-[#2E7D32]',
      iconBg: 'bg-[#EAF5E8]',
      icon: <Package className="w-5 h-5 text-[#2E7D32]" />,
      title: t('gateway.how.4.title'),
      titleColor: 'text-[#2E7D32]',
      description: t('gateway.how.4.desc'),
    },
    {
      stepNum: 5,
      numColor: 'bg-[#2E7D32]',
      iconBg: 'bg-[#EAF5E8]',
      icon: <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />,
      title: t('gateway.how.5.title'),
      titleColor: 'text-[#2E7D32]',
      description: t('gateway.how.5.desc'),
    },
  ];

  const BENEFIT_POINTS = [
    {
      title: t('gateway.benefit.1.title'),
      description: t('gateway.benefit.1.desc'),
      icon: <TrendingUp className="w-5 h-5 text-[#2E7D32]" />,
    },
    {
      title: t('gateway.benefit.2.title'),
      description: t('gateway.benefit.2.desc'),
      icon: <Layers className="w-5 h-5 text-[#E67E22]" />,
    },
    {
      title: t('gateway.benefit.3.title'),
      description: t('gateway.benefit.3.desc'),
      icon: <Sprout className="w-5 h-5 text-[#2E7D32]" />,
    },
    {
      title: t('gateway.benefit.4.title'),
      description: t('gateway.benefit.4.desc'),
      icon: <ShieldCheck className="w-5 h-5 text-[#2474B5]" />,
    },
  ];

  return (
    <main className="relative z-10 flex-1 flex flex-col justify-between pb-16 bg-[#FAFBF7]">
      
      {/* 1. Hero Section */}
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12 sm:space-y-16 pt-8 sm:pt-12">
        
        {/* 2. Three Major Role Cards */}
        <section id="role-selection" className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ROLE_CARDS.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        </section>

        {/* 3. How RuralFlow Works Section */}
        <section id="how-it-works-section" className="w-full">
          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#E5E8E2] shadow-2xs">
            
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17211B]">
                {t('gateway.how.title')}
              </h2>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Sprout className="w-4 h-4 text-[#2E7D32]" />
              </div>
            </div>

            {/* 5 Horizontal Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4 relative">
              {HOW_IT_WORKS_STEPS.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center relative group">
                  
                  {/* Step Number Badge */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold mb-3 ${item.numColor} shadow-2xs`}
                  >
                    {item.stepNum}
                  </div>

                  {/* Circular Icon */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${item.iconBg} mb-3 shadow-2xs`}
                  >
                    {item.icon}
                  </div>

                  {/* Step Title */}
                  <h3 className="text-sm font-bold text-[#17211B] mb-1">
                    {item.title}
                  </h3>

                  {/* Step Description */}
                  <p className="text-xs text-[#66706A] leading-relaxed max-w-[200px]">
                    {item.description}
                  </p>

                  {/* Subtle Connecting Arrow for Desktop (Except Last Step) */}
                  {idx < HOW_IT_WORKS_STEPS.length - 1 && (
                    <div className="hidden lg:flex items-center absolute -right-3 top-12 text-[#D1D5CB]">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Agricultural Benefit Strip */}
        <section className="w-full">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#EAF5E8]/60 border border-green-200/80 shadow-2xs">
            <div className="text-center mb-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2E7D32] bg-white px-3 py-1 rounded-full border border-green-200 shadow-2xs inline-block">
                {t('gateway.benefit.badge')}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#17211B] mt-2">
                {t('gateway.benefit.title')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BENEFIT_POINTS.map((pt, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white border border-green-100 shadow-2xs flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#FAFBF7] border border-[#E5E8E2]">
                      {pt.icon}
                    </div>
                    <h3 className="text-xs font-bold text-[#17211B]">{pt.title}</h3>
                  </div>
                  <p className="text-[11px] text-[#66706A] leading-relaxed">
                    {pt.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 5. Clean Ecosystem Footer */}
      <footer className="mt-16 pt-8 border-t border-[#E5E8E2] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-[#66706A] w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#17211B]">RuralFlow</span>
            <span>•</span>
            <span>{t('gateway.footer.1')}</span>
            <span>•</span>
            <span>{t('gateway.footer.2')}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#66706A]">
            <span>{t('gateway.footer.3')}</span>
            <span>•</span>
            <span>{t('gateway.footer.4')}</span>
          </div>
        </div>
      </footer>
    </main>
  );
};
