import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface HeroSectionProps {
  currentLang: SupportedLanguage;
}

// Regional language subtitles or localization hints
const LOCALIZED_HERO: Record<SupportedLanguage, { badge: string; sub: string }> = {
  en: {
    badge: 'Built for smarter rural commerce • SIH Edition',
    sub: 'Connect producers, transporters and markets through intelligent matching, optimized routes and efficient last-mile logistics.',
  },
  hi: {
    badge: 'स्मार्ट ग्रामीण व्यापार और परिवहन हेतु निर्मित • SIH संस्करण',
    sub: 'उत्पादकों, वाहन चालकों और बाज़ारों को साझा परिवहन, कुशल मार्गों और सीधे बाज़ार से जोड़ें।',
  },
  mr: {
    badge: 'ग्रामीण व्यापार आणि वाहतुकीसाठी स्मार्ट प्लॅटफॉर्म • SIH',
    sub: 'शेतकरी, वाहतूकदार आणि खरेदीदारांना थेट बाजारपेठ आणि कार्यक्षम वाहतुकीने जोडा.',
  },
  ta: {
    badge: 'ஸ்மார்ட் கிராமப்புற வர்த்தகத்திற்கான தளம் • SIH',
    sub: 'உற்பத்தியாளர்கள், வாகன ஓட்டுநர்கள் மற்றும் சந்தைகளை புத்திசாலித்தனமாக இணைக்கிறது.',
  },
  te: {
    badge: 'స్మార్ట్ గ్రామీణ లాజిస్టిక్స్ ప్లాట్‌ఫారమ్ • SIH',
    sub: 'ఉత్పత్తిదారులు, రవాణాదారులు మరియు మార్కెట్లను సమర్థవంతమైన మార్గాలతో కలుపుతుంది.',
  },
  bn: {
    badge: 'স্মার্ট গ্রামীণ লজিস্টিক প্ল্যাটফর্ম • SIH',
    sub: 'উৎপাদক, পরিবহনকারী এবং বাজারকে দক্ষ রুট এবং সরাসরি বাণিজ্যে সংযুক্ত করে।',
  },
  kn: {
    badge: 'ಸ್ಮಾರ್ಟ್ ಗ್ರಾಮೀಣ ಸಾರಿಗೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ • SIH',
    sub: 'ಉತ್ಪಾದಕರು, ಸಾರಿಗೆದಾರರು ಮತ್ತು ಮಾರುಕಟ್ಟೆಗಳನ್ನು ನೇರವಾಗಿ ಮತ್ತು ಸುಲಭವಾಗಿ ಸಂಪರ್ಕಿಸಿ.',
  },
};

export const HeroSection: React.FC<HeroSectionProps> = ({ currentLang }) => {
  const content = LOCALIZED_HERO[currentLang] || LOCALIZED_HERO.en;

  return (
    <section className="relative pt-8 pb-4 sm:pt-14 sm:pb-8 text-center max-w-5xl mx-auto px-4 sm:px-6">
      
      {/* Top Status / Trust Badge */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm mb-6 sm:mb-8 backdrop-blur-md"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>{content.badge}</span>
      </motion.div>

      {/* Primary Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl mx-auto"
      >
        One Platform.{' '}
        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
          Smarter Rural Logistics.
        </span>
      </motion.h1>

      {/* Supporting Value Proposition Text */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed"
      >
        {content.sub}
      </motion.p>

      {/* Micro-Trust & Value Badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-400"
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Direct Farm-to-Market</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          <span>Shared Load Pooling</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <Layers className="w-3.5 h-3.5 text-violet-400" />
          <span>Zero Middlemen Markups</span>
        </div>
      </motion.div>
    </section>
  );
};
