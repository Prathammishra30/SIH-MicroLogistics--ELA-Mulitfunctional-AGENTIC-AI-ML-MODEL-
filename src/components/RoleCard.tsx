import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sprout, ShoppingCart, Truck } from 'lucide-react';

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
}

export const RoleCard: React.FC<RoleCardProps> = ({ role }) => {
  const navigate = useNavigate();

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

  return (
    <div
      id={`role-${role.id}`}
      onClick={() => navigate(role.route)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Select role: ${role.title}. ${role.description}`}
      className={`group flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6 rounded-3xl ${role.accentColor.gradientBg} border ${role.accentColor.border} ${role.accentColor.borderHover} transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:outline-none text-left`}
    >
      {/* Prominent Circular Agricultural Image */}
      <div className="shrink-0 relative">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white shadow-xs">
          <img
            src={role.imageSrc}
            alt={role.imageAlt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 flex flex-col justify-between h-full space-y-3">
        <div>
          {/* Header with Circular Icon Badge + Title */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${role.accentColor.badgeIconBg} shadow-2xs shrink-0`}
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

        {/* Clean Outlined Action Button */}
        <div className="pt-2">
          <button
            type="button"
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold border ${role.accentColor.btnBorder} ${role.accentColor.btnText} ${role.accentColor.btnHoverBg} transition-colors flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer shadow-2xs`}
          >
            <span>{role.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
