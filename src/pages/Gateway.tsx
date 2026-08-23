import React from 'react';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/HeroSection';
import { RoleCard } from '../components/RoleCard';
import type { RoleConfig, SupportedLanguage } from '../types';

interface GatewayProps {
  currentLang: SupportedLanguage;
}

const ROLES: RoleConfig[] = [
  {
    id: 'farmer',
    title: 'Farmer / Artisan',
    tagline: 'Sell smarter',
    description:
      'List your products, discover demand and move your goods to the right market at the right time.',
    ctaText: 'Continue as Farmer',
    badge: 'Sell smarter',
    route: '/auth/farmer',
    accentColor: {
      primary: '#10B981',
      border: 'border-emerald-500/30',
      bgHover: 'group-hover:border-emerald-500/60',
      badgeBg: 'bg-emerald-500/10',
      badgeText: 'text-emerald-400',
      glow: 'rgba(16, 185, 129, 0.15)',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    featuresPreview: ['Produce Listing', 'Demand Signals', 'Direct Settlement'],
  },
  {
    id: 'transporter',
    title: 'Transporter',
    tagline: 'Move efficiently',
    description:
      'Find optimized delivery opportunities, improve vehicle utilization and reduce empty return trips.',
    ctaText: 'Continue as Transporter',
    badge: 'Move efficiently',
    route: '/auth/transporter',
    accentColor: {
      primary: '#0EA5E9',
      border: 'border-sky-500/30',
      bgHover: 'group-hover:border-sky-500/60',
      badgeBg: 'bg-sky-500/10',
      badgeText: 'text-sky-400',
      glow: 'rgba(14, 165, 233, 0.15)',
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-400',
    },
    featuresPreview: ['Shared Load Matching', 'Empty Return Booking', 'Route Optimization'],
  },
  {
    id: 'buyer',
    title: 'Buyer / Market',
    tagline: 'Source reliably',
    description:
      'Discover reliable producers, post demand and manage incoming shipments efficiently.',
    ctaText: 'Continue as Buyer / Market',
    badge: 'Source reliably',
    route: '/auth/buyer',
    accentColor: {
      primary: '#8B5CF6',
      border: 'border-violet-500/30',
      bgHover: 'group-hover:border-violet-500/60',
      badgeBg: 'bg-violet-500/10',
      badgeText: 'text-violet-400',
      glow: 'rgba(139, 92, 246, 0.15)',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
    },
    featuresPreview: ['Direct Source Verification', 'Live Demand Posting', 'Shipment Tracking'],
  },
];

export const Gateway: React.FC<GatewayProps> = ({ currentLang }) => {
  return (
    <main className="relative z-10 flex-1 flex flex-col justify-between pb-16">
      
      {/* Hero Section */}
      <HeroSection currentLang={currentLang} />

      {/* Role Selection Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 w-full">
        
        {/* Section Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
          >
            How are you using the platform?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-2 text-sm text-slate-400 max-w-xl mx-auto"
          >
            Select your entry point to access tailored micro-logistics tools, shared routing, and market connections.
          </motion.p>
        </div>

        {/* 3 Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {ROLES.map((role, idx) => (
            <RoleCard key={role.id} role={role} index={idx} />
          ))}
        </div>
      </section>

      {/* Bottom Ecosystem Statement Footer */}
      <footer className="mt-16 sm:mt-20 pt-8 border-t border-slate-800/60 max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-400">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>RuralFlow Ecosystem</span>
          <span>•</span>
          <span>Smart India Hackathon (SIH)</span>
          <span>•</span>
          <span>Optimized Micro-Logistics Platform</span>
        </p>
      </footer>
    </main>
  );
};
