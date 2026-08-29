import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type PortalRole = 'farmer' | 'buyer' | 'transporter';

export interface HeroAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}

export interface PortalHeroProps {
  role: PortalRole;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  actions?: HeroAction[];
}

const ROLE_CONFIGS = {
  farmer: {
    gradientOverlay: 'bg-gradient-to-t from-black/95 via-green-950/70 to-emerald-900/30',
    meshGlow: 'bg-emerald-500/25',
    meshGlowSecond: 'bg-green-600/15',
    primaryBtn:
      'bg-white/95 text-[#2E7D32] hover:bg-white border-green-100 hover:shadow-[0_0_20px_rgba(46,125,50,0.3)]',
    secondaryBtn:
      'bg-green-600/30 hover:bg-green-600/50 border-green-400/30 text-white hover:shadow-[0_0_15px_rgba(74,222,128,0.2)]',
    subtitleColor: 'text-green-100',
  },
  buyer: {
    gradientOverlay: 'bg-gradient-to-t from-black/95 via-blue-950/70 to-indigo-900/30',
    meshGlow: 'bg-blue-500/25',
    meshGlowSecond: 'bg-indigo-600/15',
    primaryBtn:
      'bg-white/95 text-blue-800 hover:bg-white border-blue-100 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]',
    secondaryBtn:
      'bg-blue-600/30 hover:bg-blue-600/50 border-blue-400/30 text-white hover:shadow-[0_0_15px_rgba(96,165,250,0.2)]',
    subtitleColor: 'text-blue-100',
  },
  transporter: {
    gradientOverlay: 'bg-gradient-to-t from-black/95 via-orange-950/70 to-amber-900/30',
    meshGlow: 'bg-orange-500/25',
    meshGlowSecond: 'bg-amber-600/15',
    primaryBtn:
      'bg-white/95 text-orange-800 hover:bg-white border-orange-100 hover:shadow-[0_0_20px_rgba(234,88,12,0.3)]',
    secondaryBtn:
      'bg-orange-600/30 hover:bg-orange-600/50 border-orange-400/30 text-white hover:shadow-[0_0_15px_rgba(251,146,60,0.2)]',
    subtitleColor: 'text-orange-100',
  },
};

export const PortalHero: React.FC<PortalHeroProps> = ({
  role,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  actions = [],
}) => {
  const shouldReduceMotion = useReducedMotion();
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.farmer;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
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
        duration: shouldReduceMotion ? 0 : 0.5,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 bg-gray-950 p-8 sm:p-12 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-24 shadow-2xl min-h-[300px] rounded-b-[2.5rem]">
      {/* Background Photography with Lazy Loading */}
      <div className="absolute inset-0 z-0">
        <img
          src={imageSrc}
          alt={imageAlt}
          loading="lazy"
          className="w-full h-full object-cover object-center opacity-75 mix-blend-overlay"
        />
        {/* Layered Multi-Stop Role Tinted Gradient Overlay */}
        <div className={`absolute inset-0 ${config.gradientOverlay}`} />
        
        {/* Mesh Gradient Ambient Glow Blobs */}
        <div
          className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-70 animate-pulse duration-1000 ${config.meshGlow}`}
        />
        <div
          className={`absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-50 ${config.meshGlowSecond}`}
        />
      </div>

      {/* Main Text Content with Framer Motion Stagger */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full mb-8"
      >
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md"
        >
          {title}
        </motion.h1>
        
        <motion.p
          variants={itemVariants}
          className={`text-sm sm:text-base ${config.subtitleColor} mt-3 max-w-2xl font-medium drop-shadow-sm leading-relaxed`}
        >
          {subtitle}
        </motion.p>
      </motion.div>

      {/* CTA Buttons with Micro-animations */}
      {actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            delay: shouldReduceMotion ? 0 : 0.25,
            ease: 'easeOut',
          }}
          className="flex items-center gap-3 relative z-10 mb-8 sm:mb-8 shrink-0"
        >
          {actions.map((action, idx) => {
            const isPrimary = action.primary ?? (idx === 0);
            const btnStyle = isPrimary ? config.primaryBtn : config.secondaryBtn;

            return (
              <motion.button
                key={action.label}
                type="button"
                onClick={action.onClick}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : { scale: 1.02, y: -1, transition: { duration: 0.15 } }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : { scale: 0.97, transition: { duration: 0.1 } }
                }
                className={`px-6 py-3 rounded-2xl text-sm font-bold shadow-xl flex items-center gap-2 cursor-pointer border backdrop-blur-md transition-all duration-200 ${btnStyle}`}
              >
                {action.icon}
                <span>{action.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
