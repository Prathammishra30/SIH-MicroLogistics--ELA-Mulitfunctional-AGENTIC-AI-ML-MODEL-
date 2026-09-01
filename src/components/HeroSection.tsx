import React from 'react';
import { ArrowRight, Sprout, Truck, Store, MapPin, Bot, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface HeroSectionProps {
  onExploreRoles?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreRoles }) => {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <section className="relative w-full overflow-hidden min-h-[620px] sm:min-h-[720px] flex items-center">
      {/* Full-width Landscape Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-landscape.jpg"
          alt="Lush green agricultural farmland with rural road and logistics truck"
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {/* Layered Multi-stop Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-emerald-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

        {/* Ambient Mesh Gradient Blur Blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center justify-between gap-12 py-16 sm:py-20">
        {/* Left Text Content with Framer Motion Stagger */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full lg:w-3/5 text-left text-white"
        >
          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] drop-shadow-md"
          >
            {t('gateway.hero.prefix')}
            <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              {t('gateway.hero.farmers')}
            </span>
            <br className="hidden sm:inline" />
            <span className="text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.3)]">
              {t('gateway.hero.buyers')}
            </span>
            {t('gateway.hero.and')}
            <span className="text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              {t('gateway.hero.transporters')}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-6 text-base sm:text-lg text-gray-200 leading-relaxed max-w-xl font-medium drop-shadow-sm"
          >
            {t('gateway.hero.sub')}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <motion.button
              onClick={scrollToRoles}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { scale: 1.03, y: -2, transition: { duration: 0.15 } }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : { scale: 0.97, transition: { duration: 0.1 } }
              }
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base transition-colors shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-2 cursor-pointer border border-emerald-500"
            >
              <span>{t('gateway.hero.ctaPrimary')}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={scrollToHowItWorks}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { scale: 1.03, y: -2, transition: { duration: 0.15 } }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : { scale: 0.97, transition: { duration: 0.1 } }
              }
              className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-sm sm:text-base transition-colors cursor-pointer shadow-lg hover:shadow-white/10"
            >
              {t('gateway.hero.ctaSecondary')}
            </motion.button>

            <motion.button
              onClick={() => window.dispatchEvent(new CustomEvent('open-ela-chat'))}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { scale: 1.03, y: -2, transition: { duration: 0.15 } }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : { scale: 0.97, transition: { duration: 0.1 } }
              }
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-600 hover:from-emerald-600 hover:to-green-500 text-white font-bold text-sm sm:text-base transition-all shadow-xl hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2.5 cursor-pointer border border-emerald-400/50"
            >
              <Bot className="w-5 h-5 text-amber-300" />
              <span>Talk to ELA</span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right Interactive Visual Panel (Glassmorphism) */}
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.65,
            delay: shouldReduceMotion ? 0 : 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="hidden lg:block w-full lg:w-2/5"
        >
          <div className="bg-white/12 backdrop-blur-2xl border border-white/25 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/20 pb-4">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  <Sprout className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">AgriRoute</span>
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40 shadow-xs flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                {t('gateway.hero.matchRate')}
              </div>
            </div>

            {/* Simulated Logistics Flow */}
            <div className="space-y-4 pt-2">
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, x: 2 }}
                className="bg-white/85 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between shadow-md border border-white/80 transition-transform cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-green-700 shadow-inner border border-green-200">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{t('gateway.role.farmer.badge')}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-600" /> {t('gateway.hero.alphaVillage')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 font-mono">500 kg</div>
                  <div className="text-xs text-emerald-600 font-bold">{t('gateway.hero.ready')}</div>
                </div>
              </motion.div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white rounded-full p-2.5 shadow-lg border border-amber-200 animate-bounce duration-1000">
                  <Truck className="w-5 h-5 text-amber-600" />
                </div>
              </div>

              <motion.div
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, x: 2 }}
                className="bg-white/85 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between shadow-md border border-white/80 transition-transform cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-700 shadow-inner border border-blue-200">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{t('gateway.role.buyer.badge')}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-600" /> {t('gateway.hero.centralHub')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 font-mono">₹12,500</div>
                  <div className="text-xs text-blue-600 font-bold">{t('gateway.hero.verified')}</div>
                </div>
              </motion.div>
            </div>

            <button className="mt-4 w-full py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-colors border border-white/30 cursor-default shadow-xs">
              {t('gateway.hero.liveLogistics')}
            </button>
            <div className="text-center mt-1">
              <span className="text-[10px] text-gray-300 uppercase tracking-wider font-medium">
                {t('gateway.hero.exampleTransaction')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
