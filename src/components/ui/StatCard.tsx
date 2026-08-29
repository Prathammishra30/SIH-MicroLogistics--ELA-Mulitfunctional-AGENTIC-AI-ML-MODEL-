import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { CountUp } from './CountUp';

export type PortalTheme = 'farmer' | 'buyer' | 'transporter' | 'neutral';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  theme?: PortalTheme;
  colorScheme?: 'green' | 'amber' | 'blue' | 'emerald' | 'gray';
  index?: number;
}

const THEME_STYLES = {
  green: {
    iconBg: 'bg-gradient-to-br from-green-50 to-green-100/90 text-[#2E7D32] border-green-200/80 shadow-[0_0_12px_rgba(46,125,50,0.15)]',
    watermark: 'text-green-900',
    subtext: 'text-green-700',
    shadow: 'shadow-xl shadow-green-950/5 hover:shadow-2xl hover:shadow-green-700/10',
    border: 'border-white/70 hover:border-green-200/60',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100/90 text-amber-700 border-amber-200/80 shadow-[0_0_12px_rgba(217,119,6,0.15)]',
    watermark: 'text-amber-900',
    subtext: 'text-amber-700',
    shadow: 'shadow-xl shadow-amber-950/5 hover:shadow-2xl hover:shadow-amber-700/10',
    border: 'border-white/70 hover:border-amber-200/60',
  },
  blue: {
    iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100/90 text-blue-700 border-blue-200/80 shadow-[0_0_12px_rgba(37,99,235,0.15)]',
    watermark: 'text-blue-900',
    subtext: 'text-blue-700',
    shadow: 'shadow-xl shadow-blue-950/5 hover:shadow-2xl hover:shadow-blue-700/10',
    border: 'border-white/70 hover:border-blue-200/60',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/90 text-emerald-700 border-emerald-200/80 shadow-[0_0_12px_rgba(5,150,105,0.15)]',
    watermark: 'text-emerald-900',
    subtext: 'text-emerald-700',
    shadow: 'shadow-xl shadow-emerald-950/5 hover:shadow-2xl hover:shadow-emerald-700/10',
    border: 'border-white/70 hover:border-emerald-200/60',
  },
  gray: {
    iconBg: 'bg-gradient-to-br from-gray-50 to-gray-100/90 text-gray-700 border-gray-200/80 shadow-[0_0_12px_rgba(100,116,139,0.12)]',
    watermark: 'text-gray-900',
    subtext: 'text-gray-600',
    shadow: 'shadow-xl shadow-gray-950/5 hover:shadow-2xl hover:shadow-gray-700/10',
    border: 'border-white/70 hover:border-gray-300/60',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  colorScheme = 'green',
  index = 0,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const styles = THEME_STYLES[colorScheme] || THEME_STYLES.green;

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.45,
        delay: shouldReduceMotion ? 0 : index * 0.07,
        ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              transition: { duration: 0.2, ease: 'easeOut' },
            }
      }
      className={`p-6 rounded-3xl bg-white/80 backdrop-blur-xl border ${styles.border} ${styles.shadow} space-y-2 relative overflow-hidden group transition-colors duration-200`}
    >
      {/* Subtle background watermark icon */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
        <Icon className={`w-16 h-16 ${styles.watermark}`} />
      </div>

      {/* Header Label + Glowing Icon Chip */}
      <div className="flex items-center justify-between text-gray-500 relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 ${styles.iconBg}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Main Animated Value */}
      <div className="text-3xl sm:text-4xl font-black text-gray-900 relative z-10 tracking-tight">
        <CountUp value={value} />
      </div>

      {/* Optional Subtext */}
      {subtext && (
        <span className={`text-xs font-medium relative z-10 block ${styles.subtext}`}>
          {subtext}
        </span>
      )}
    </motion.div>
  );
};
