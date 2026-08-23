import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VerificationSuccessProps {
  roleTitle: string;
  dashboardRoute: string;
  accentColor?: string;
}

export const VerificationSuccess: React.FC<VerificationSuccessProps> = ({
  roleTitle,
  dashboardRoute,
  accentColor = '#10B981',
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(dashboardRoute);
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate, dashboardRoute]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center py-8 space-y-6 max-w-md mx-auto"
    >
      {/* Animated Check Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl relative"
        style={{ backgroundColor: `${accentColor}20`, border: `2px solid ${accentColor}` }}
      >
        <Check className="w-10 h-10" style={{ color: accentColor }} />
        
        {/* Particle sparkles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1 -right-1 text-amber-400"
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Success Text */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          ✓ You're verified
        </h2>
        <p className="text-sm text-slate-300">
          Welcome to RuralFlow, <strong className="text-white">{roleTitle}</strong>.
        </p>
        <p className="text-xs text-slate-400">
          Redirecting to your dashboard...
        </p>
      </div>

      {/* Progress Line */}
      <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Instant Action */}
      <button
        type="button"
        onClick={() => navigate(dashboardRoute)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-4 transition-colors pt-2"
      >
        <span>Enter Dashboard Now</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};
