import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Route,
  Car,
  IndianRupee,
  Activity,
  LogOut,
  Menu,
  X,
  Map,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSharedContext } from '../../context/SharedContext';
import { useLanguage } from '../../context/LanguageContext';
import { PageTransition } from '../../components/ui/PageTransition';
import { SiteFooter } from '../../components/ui/SiteFooter';

export const TransporterLayout: React.FC = () => {
  const { t } = useLanguage();
  const { state, logout } = useSharedContext();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const userName = state.auth.user?.name || 'Transporter';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_ITEMS = [
    { label: t('transporter.nav.dashboard') || 'Dashboard', path: '/transporter/dashboard', icon: LayoutDashboard },
    { label: t('transporter.nav.available_trips') || 'Available Trips', path: '/transporter/trips', icon: Route },
    { label: t('transporter.nav.active_trips') || 'Active Trips', path: '/transporter/active', icon: Truck },
    { label: t('transporter.nav.fleet') || 'My Vehicles', path: '/transporter/vehicles', icon: Car },
    { label: t('transporter.nav.earnings') || 'Earnings', path: '/transporter/earnings', icon: IndianRupee },
    { label: t('transporter.nav.performance') || 'Performance', path: '/transporter/performance', icon: Activity },
    { label: t('transporter.nav.map') || 'Live Map', path: '#', icon: Map },
    { label: t('transporter.nav.settings') || 'Settings', path: '#', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F4] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-16 z-30 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{userName}</div>
            <div className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">
              {t('farmer.transporter') || 'Transporter'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`
        fixed md:sticky top-16 md:top-16 z-20
        w-64 bg-white/95 backdrop-blur-md border-r border-gray-200 shadow-sm
        flex flex-col h-[calc(100vh-4rem)]
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        {/* User Profile Area (Desktop) */}
        <div className="hidden md:flex flex-col p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-[0_0_12px_rgba(230,126,34,0.15)]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">{userName}</h2>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-wider">
                {t('farmer.transporter') || 'Transporter'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            {t('transporter.rural_fleet_dispatch_operation') || 'Fleet & Dispatch'}
          </p>
        </div>

        {/* Nav Links with Smooth Sliding Indicator */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="relative block"
              >
                {({ isActive }) => (
                  <div
                    className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                      isActive
                        ? 'text-orange-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-transporter-nav-pill"
                        className="absolute inset-0 bg-gradient-to-r from-orange-50 via-amber-50/70 to-white/90 border-l-4 border-orange-600 rounded-xl shadow-xs"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 380, damping: 32 }
                        }
                      />
                    )}
                    <Icon
                      className={`relative z-10 w-4 h-4 transition-transform duration-200 ${
                        isActive ? 'text-orange-600 scale-105' : 'text-gray-500'
                      }`}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100">
          <motion.button
            onClick={handleLogout}
            whileHover={shouldReduceMotion ? undefined : { x: 2 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-red-700 hover:bg-red-50/80 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('farmer.logout')}</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative min-w-0 bg-[#F4F7F4] flex flex-col justify-between">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
        <div className="w-full">
          <SiteFooter compact />
        </div>
      </main>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-10 md:hidden backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
