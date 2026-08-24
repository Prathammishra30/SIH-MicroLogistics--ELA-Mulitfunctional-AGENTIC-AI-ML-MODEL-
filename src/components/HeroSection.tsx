import React from 'react';
import { ArrowRight, Sprout, Truck, Store, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeroSectionProps {
  onExploreRoles?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreRoles }) => {
  const { t } = useLanguage();

  const scrollToRoles = () => {
    if (onExploreRoles) {
      onExploreRoles();
    } else {
      const el = document.getElementById('role-selection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full overflow-hidden min-h-[600px] sm:min-h-[700px] flex items-center">
      
      {/* Full-width Landscape Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-landscape.jpg"
          alt="Lush green agricultural farmland with rural road and logistics truck"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center justify-between gap-12 py-16">
        
        {/* Left Text Content */}
        <div className="w-full lg:w-3/5 text-left text-white">
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] drop-shadow-md">
            {t('gateway.hero.prefix')}
            <span className="text-green-400">{t('gateway.hero.farmers')}</span>
            <br className="hidden sm:inline" />
            <span className="text-blue-400">{t('gateway.hero.buyers')}</span>
            {t('gateway.hero.and')}
            <span className="text-orange-400">{t('gateway.hero.transporters')}</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-gray-200 leading-relaxed max-w-xl font-medium drop-shadow-sm">
            {t('gateway.hero.sub')}
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={scrollToRoles}
              className="px-8 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm sm:text-base transition-colors shadow-lg flex items-center gap-2 cursor-pointer border border-green-500"
            >
              <span>{t('gateway.hero.ctaPrimary')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={scrollToHowItWorks}
              className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-sm sm:text-base transition-colors cursor-pointer shadow-lg"
            >
              {t('gateway.hero.ctaSecondary')}
            </button>
          </div>
        </div>

        {/* Right Interactive Visual Panel (Glassmorphism) */}
        <div className="hidden lg:block w-full lg:w-2/5">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            
            <div className="flex items-center justify-between border-b border-white/20 pb-4">
              <div className="flex items-center gap-2 text-white">
                <Sprout className="w-6 h-6 text-green-400" />
                <span className="font-bold text-lg">RuralFlow</span>
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-green-300 bg-green-900/40 px-3 py-1 rounded-full border border-green-500/30">
                Match Rate: High
              </div>
            </div>

            {/* Simulated Logistics Flow */}
            <div className="space-y-4 pt-2">
              <div className="bg-white/80 rounded-2xl p-4 flex items-center justify-between shadow-sm transform hover:scale-[1.02] transition-transform cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Farmer</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> Alpha Village</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">500 kg</div>
                  <div className="text-xs text-green-600 font-medium">Ready</div>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white rounded-full p-2 shadow-md border border-gray-100">
                  <Truck className="w-5 h-5 text-orange-500" />
                </div>
              </div>

              <div className="bg-white/80 rounded-2xl p-4 flex items-center justify-between shadow-sm transform hover:scale-[1.02] transition-transform cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Buyer</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> Central Hub</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">₹12,500</div>
                  <div className="text-xs text-blue-600 font-medium">Verified</div>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-colors border border-white/30 cursor-default">
              Live Logistics Dashboard
            </button>
            <div className="text-center mt-1">
               <span className="text-[10px] text-gray-300 uppercase tracking-wider">Example Transaction</span>
            </div>

          </div>
        </div>
        
      </div>
    </section>
  );
};
