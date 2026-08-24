import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Menu, X, ChevronDown, Sprout, LogOut, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSharedContext } from '../context/SharedContext';
import type { Language } from '../i18n/translations';
import type { ModalType, LanguageOption } from '../types';

interface NavbarProps {
  onOpenModal: (modal: ModalType) => void;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenModal,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { state, logout } = useSharedContext();
  const { isAuthenticated, role } = state.auth;
  const navigate = useNavigate();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E8E2] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <a
          href="/"
          className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#2E7D32] rounded-lg py-1 px-1"
          aria-label="RuralFlow Homepage"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EAF5E8] border border-green-200/80 flex items-center justify-center text-[#2E7D32] shadow-2xs group-hover:bg-green-100 transition-colors">
            <Sprout className="w-5 h-5" />
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#17211B] leading-none">
              RuralFlow
            </span>
            <span className="text-[10px] font-medium text-[#66706A] tracking-wider uppercase mt-0.5">
              {t('nav.tagline') || 'Optimized Micro-Logistics'}
            </span>
          </div>
        </a>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2E7D32] hover:bg-[#EAF5E8] transition-colors"
          >
            {t('nav.home') || 'Home'}
          </a>

          {!isAuthenticated ? (
            <>
              <button
                onClick={() => scrollToSection('how-it-works-section')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('nav.howItWorks') || 'How It Works'}
              </button>

              <button
                onClick={() => scrollToSection('role-farmer')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('nav.forFarmers') || 'For Farmers'}
              </button>

              <button
                onClick={() => scrollToSection('role-buyer')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('nav.forBuyers') || 'For Buyers'}
              </button>

              <button
                onClick={() => scrollToSection('role-transporter')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('nav.forTransporters') || 'For Transporters'}
              </button>
            </>
          ) : (
            <>
              {role === 'FARMER' && (
                <>
                  <button onClick={() => navigate('/farmer/dashboard')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>{t('nav.farmer.dashboard') || 'Dashboard'}</span>
                  </button>
                  <button onClick={() => navigate('/farmer/products')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.farmer.products') || 'My Products'}
                  </button>
                  <button onClick={() => navigate('/farmer/logistics')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.farmer.logistics') || 'Logistics Request'}
                  </button>
                  <button onClick={() => navigate('/farmer/markets')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.farmer.markets') || 'Market Demand'}
                  </button>
                  <button onClick={() => navigate('/farmer/deliveries')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.farmer.deliveries') || 'Deliveries'}
                  </button>
                </>
              )}
              {role === 'BUYER' && (
                <>
                  <button onClick={() => navigate('/buyer/dashboard')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>{t('nav.buyer.dashboard') || 'Dashboard'}</span>
                  </button>
                  <button onClick={() => navigate('/buyer/procurement')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.buyer.postProcurement') || 'Post Procurement'}
                  </button>
                  <button onClick={() => navigate('/buyer/orders')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.buyer.orders') || 'Orders & Tracking'}
                  </button>
                  <button onClick={() => navigate('/buyer/produce')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.buyer.produceCatalog') || 'Produce Catalog'}
                  </button>
                </>
              )}
              {role === 'TRANSPORTER' && (
                <>
                  <button onClick={() => navigate('/transporter/dashboard')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>{t('nav.transporter.dashboard') || 'Dashboard'}</span>
                  </button>
                  <button onClick={() => navigate('/transporter/trips')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.transporter.availableTrips') || 'Available Trips'}
                  </button>
                  <button onClick={() => navigate('/transporter/active')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.transporter.activeTrips') || 'Active Trips'}
                  </button>
                  <button onClick={() => navigate('/transporter/vehicles')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.transporter.myVehicles') || 'My Vehicles'}
                  </button>
                  <button onClick={() => navigate('/transporter/earnings')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.transporter.earnings') || 'Earnings'}
                  </button>
                  <button onClick={() => navigate('/transporter/performance')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('nav.transporter.performance') || 'Performance'}
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={() => onOpenModal('about')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('nav.aboutUs') || 'About Us'}
          </button>

          <button
            onClick={() => onOpenModal('contact')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#17211B] hover:text-[#2E7D32] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('nav.contactUs') || 'Contact Us'}
          </button>
        </nav>

        {/* Right Tools (Language Selector + Auth Buttons + Mobile Menu Toggle) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E8E2] hover:bg-gray-50 text-[#17211B] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              aria-label="Select Language"
              aria-expanded={isLangOpen}
            >
              <Globe className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>{activeLanguage.name}</span>
              <ChevronDown className="w-3 h-3 text-[#66706A]" />
            </button>

            {isLangOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsLangOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-[#E5E8E2] shadow-lg py-1 z-30 divide-y divide-gray-100">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#66706A]">
                    Select Language
                  </div>
                  <div className="py-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as Language);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          language === lang.code
                            ? 'bg-[#EAF5E8] text-[#2E7D32] font-bold'
                            : 'text-[#17211B] hover:bg-gray-50'
                        }`}
                      >
                        <span>{lang.nativeName}</span>
                        <span className="text-[10px] text-[#66706A]">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {!isAuthenticated ? (
            <>
              {/* Log In Button */}
              <button
                onClick={() => scrollToSection('role-selection')}
                className="hidden sm:inline-flex items-center px-4 py-1.5 rounded-lg border border-[#E5E8E2] hover:border-gray-400 bg-white hover:bg-gray-50 text-[#17211B] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                {t('nav.login') || 'Log In'}
              </button>

              {/* Get Started Button */}
              <button
                onClick={() => scrollToSection('role-selection')}
                className="inline-flex items-center px-4 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#256628] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                {t('nav.getStarted') || 'Get Started'}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('nav.logout') || 'Sign Out'}</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-gray-50 border border-[#E5E8E2] text-[#17211B] hover:text-[#2E7D32] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E8E2] bg-white px-4 pt-3 pb-5 space-y-1">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  scrollToSection('how-it-works-section');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors"
              >
                {t('nav.howItWorks') || 'How It Works'}
              </button>
              <button
                onClick={() => {
                  scrollToSection('role-farmer');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors"
              >
                {t('nav.forFarmers') || 'For Farmers'}
              </button>
              <button
                onClick={() => {
                  scrollToSection('role-buyer');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors"
              >
                {t('nav.forBuyers') || 'For Buyers'}
              </button>
              <button
                onClick={() => {
                  scrollToSection('role-transporter');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors"
              >
                {t('nav.forTransporters') || 'For Transporters'}
              </button>
            </>
          ) : (
            <>
              {role === 'FARMER' && (
                <>
                  <button onClick={() => { navigate('/farmer/dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#2E7D32] bg-[#EAF5E8] transition-colors flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('nav.farmer.dashboard') || 'Dashboard'}</span>
                  </button>
                  <button onClick={() => { navigate('/farmer/products'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.farmer.products') || 'My Products'}
                  </button>
                  <button onClick={() => { navigate('/farmer/logistics'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.farmer.logistics') || 'Logistics Request'}
                  </button>
                  <button onClick={() => { navigate('/farmer/markets'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.farmer.markets') || 'Market Demand'}
                  </button>
                  <button onClick={() => { navigate('/farmer/deliveries'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.farmer.deliveries') || 'Deliveries'}
                  </button>
                </>
              )}
              {role === 'BUYER' && (
                <>
                  <button onClick={() => { navigate('/buyer/dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#2E7D32] bg-[#EAF5E8] transition-colors flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('nav.buyer.dashboard') || 'Dashboard'}</span>
                  </button>
                  <button onClick={() => { navigate('/buyer/procurement'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.buyer.postProcurement') || 'Post Procurement'}
                  </button>
                  <button onClick={() => { navigate('/buyer/orders'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.buyer.orders') || 'Orders & Tracking'}
                  </button>
                  <button onClick={() => { navigate('/buyer/produce'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.buyer.produceCatalog') || 'Produce Catalog'}
                  </button>
                </>
              )}
              {role === 'TRANSPORTER' && (
                <>
                  <button onClick={() => { navigate('/transporter/dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#2E7D32] bg-[#EAF5E8] transition-colors flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('nav.transporter.dashboard') || 'Dashboard'}</span>
                  </button>
                  <button onClick={() => { navigate('/transporter/trips'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.transporter.availableTrips') || 'Available Trips'}
                  </button>
                  <button onClick={() => { navigate('/transporter/active'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.transporter.activeTrips') || 'Active Trips'}
                  </button>
                  <button onClick={() => { navigate('/transporter/vehicles'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.transporter.myVehicles') || 'My Vehicles'}
                  </button>
                  <button onClick={() => { navigate('/transporter/earnings'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.transporter.earnings') || 'Earnings'}
                  </button>
                  <button onClick={() => { navigate('/transporter/performance'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors">
                    {t('nav.transporter.performance') || 'Performance'}
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={() => {
              onOpenModal('about');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors"
          >
            {t('nav.aboutUs') || 'About Us'}
          </button>
          <button
            onClick={() => {
              onOpenModal('contact');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#17211B] hover:bg-gray-50 transition-colors"
          >
            {t('nav.contactUs') || 'Contact Us'}
          </button>
        </div>
      )}
    </header>
  );
};
