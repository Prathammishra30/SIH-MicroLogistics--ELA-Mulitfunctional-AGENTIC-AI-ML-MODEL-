import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sprout, Truck, Store } from 'lucide-react';
import type { RoleConfig } from '../types';

interface RoleCardProps {
  role: RoleConfig;
  index: number;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, index }) => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(role.route);
    }
  };

  // Select appropriate Lucide Icon
  const renderIcon = () => {
    switch (role.id) {
      case 'farmer':
        return <Sprout className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />;
      case 'transporter':
        return <Truck className="w-7 h-7 text-sky-400 group-hover:scale-110 transition-transform duration-300" />;
      case 'buyer':
        return <Store className="w-7 h-7 text-violet-400 group-hover:scale-110 transition-transform duration-300" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 * index + 0.2 }}
      whileHover={{ y: -8 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(role.route)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Select role: ${role.title}. ${role.description}`}
      className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-600 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none text-left"
    >
      {/* Subtle Mouse Glow Effect */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 transition duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${role.accentColor.glow}, transparent 70%)`,
          }}
        />
      )}

      {/* Top Header with Icon & Micro-label */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Role Icon Container */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${role.accentColor.iconBg} ${role.accentColor.border}`}
          >
            {renderIcon()}
          </div>

          {/* Micro-label pill */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors ${role.accentColor.badgeBg} ${role.accentColor.badgeText} ${role.accentColor.border}`}
          >
            {role.badge}
          </span>
        </div>

        {/* Role Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
          {role.title}
        </h3>

        {/* Role Description */}
        <p className="mt-3 text-sm text-slate-300 leading-relaxed min-h-[4.5rem]">
          {role.description}
        </p>

        {/* Micro feature pills */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-1.5">
          {role.featuresPreview.map((feat, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-800/70 text-slate-400 font-medium"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom CTA Action Button */}
      <div className="relative z-10 mt-8 pt-4 flex items-center justify-between border-t border-slate-800/80">
        <span className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
          {role.ctaText}
        </span>
        <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center text-slate-300 transition-all duration-300 transform group-hover:translate-x-1">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};
