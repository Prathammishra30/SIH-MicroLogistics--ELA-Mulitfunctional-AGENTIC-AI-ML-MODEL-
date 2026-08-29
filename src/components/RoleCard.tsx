import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sprout, ShoppingCart, Truck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export interface RoleCardData {
  id: 'farmer' | 'buyer' | 'transporter';
  title: string;
  badgeTitle: string;
  description: string;
  ctaText: string;
  route: string;
  imageSrc: string;
  imageAlt: string;
  accentColor: {
    primary: string;
    cardBg: string;
    border: string;
    borderHover: string;
    badgeBg: string;
    badgeIconBg: string;
    badgeText: string;
    btnBorder: string;
    btnText: string;
    btnHoverBg: string;
    gradientBg: string;
  };
}

interface RoleCardProps {
  role: RoleCardData;
  index?: number;
}

const ROLE_SHADOWS = {
  farmer: 'hover:shadow-[0_20px_35px_-10px_rgba(46,125,50,0.22)]',
  buyer: 'hover:shadow-[0_20px_35px_-10px_rgba(36,116,181,0.22)]',
  transporter: 'hover:shadow-[0_20px_35px_-10px_rgba(230,126,34,0.22)]',
};

export const RoleCard: React.FC<RoleCardProps> = ({ role, index = 0 }) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(role.route);
    }
  };

  const renderBadgeIcon = () => {
    switch (role.id) {
      case 'farmer':
        return <Sprout className="w-5 h-5 text-white" />;
      case 'buyer':
        return <ShoppingCart className="w-4 h-4 text-white" />;
      case 'transporter':
        return <Truck className="w-4 h-4 text-white" />;
    }
  };

  const shadowClass = ROLE_SHADOWS[role.id] || 'hover:shadow-xl';

  return (
    <motion.div
      id={`role-${role.id}`}
      onClick={() => navigate(role.route)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Select role: ${role.title}. ${role.description}`}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: shouldReduceMotion ? 0 : index * 0.1,
        ease: [0.25, 1, 0.5, 1],
      }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -6,
              scale: 1.015,
              transition: { duration: 0.22, ease: 'easeOut' },
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
      }
      className={`group flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6 rounded-3xl ${role.accentColor.gradientBg} border ${role.accentColor.border} ${role.accentColor.borderHover} transition-shadow duration-300 cursor-pointer shadow-md ${shadowClass} focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:outline-none text-left relative overflow-hidden`}
    >
      {/* Prominent Circular Agricultural Image */}
      <div className="shrink-0 relative">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white shadow-md group-hover:shadow-lg transition-all duration-300">
          <img
            src={role.imageSrc}
            alt={role.imageAlt}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 flex flex-col justify-between h-full space-y-3">
        <div>
          {/* Header with Circular Icon Badge + Title */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${role.accentColor.badgeIconBg} shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-200`}
            >
              {renderBadgeIcon()}
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${role.accentColor.badgeText}`}>
              {role.title}
            </h2>
          </div>

          {/* Description */}
          <p className="text-xs text-[#66706A] leading-relaxed">
            {role.description}
          </p>
        </div>

        {/* Clean Outlined Action Button with micro-interaction */}
        <div className="pt-2">
          <span
            className={`inline-flex w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold border ${role.accentColor.btnBorder} ${role.accentColor.btnText} ${role.accentColor.btnHoverBg} group-hover:shadow-xs transition-colors items-center justify-center sm:justify-start gap-1.5 shadow-2xs`}
          >
            <span>{role.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};
