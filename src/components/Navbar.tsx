import React, { useState } from 'react';
import { Globe, Sun, Moon, Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import type { ModalType, SupportedLanguage, LanguageOption } from '../types';

interface NavbarProps {
  onOpenModal: (modal: ModalType) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  currentLang: SupportedLanguage;
  onChangeLang: (lang: SupportedLanguage) => void;
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
  isDark,
  onToggleTheme,
  currentLang,
  onChangeLang,
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeLanguage = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/75 dark:bg-slate-950/80 border-b border-slate-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <a
          href="/"
          className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl py-1 px-1.5"
          aria-label="RuralFlow Homepage"
        >
          {/* Intelligent Vector Logo Mark */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center p-2 shadow-sm group-hover:border-emerald-500/60 transition-all duration-300 group-hover:scale-105">
            <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Connected Logistics Nodes */}
              <circle cx="6" cy="16" r="3" className="fill-emerald-400" />
              <circle cx="26" cy="10" r="3" className="fill-sky-400" />
              <circle cx="24" cy="24" r="3" className="fill-violet-400" />
              {/* Dynamic Connecting Route Curves */}
              <path
                d="M6 16 C 12 16, 16 10, 26 10"
                stroke="url(#routeGrad1)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="2 1"
              />
              <path
                d="M6 16 C 14 18, 16 24, 24 24"
                stroke="url(#routeGrad2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Central Rural Growth Node */}
              <circle cx="15" cy="17" r="2" className="fill-emerald-300 animate-ping" opacity="0.75" />
              <circle cx="15" cy="17" r="2.5" className="fill-emerald-400" />

              <defs>
                <linearGradient id="routeGrad1" x1="6" y1="16" x2="26" y2="10" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10B981" />
                  <stop offset="1" stopColor="#38BDF8" />
                </linearGradient>
                <linearGradient id="routeGrad2" x1="6" y1="16" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10B981" />
                  <stop offset="1" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                RuralFlow
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SIH
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide hidden sm:inline-block">
              Optimized Micro-Logistics
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onOpenModal('how-it-works')}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => onOpenModal('about')}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            About
          </button>
          <button
            onClick={() => onOpenModal('contact')}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Contact
          </button>
        </nav>

        {/* Right Tools (Language Selector + Theme Toggle + Mobile Button) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              aria-label="Select Language"
              aria-expanded={isLangOpen}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeLanguage.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsLangOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 z-30 divide-y divide-slate-800/50">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Select Language
                  </div>
                  <div className="py-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onChangeLang(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                          currentLang === lang.code
                            ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{lang.nativeName}</span>
                        <span className="text-[10px] text-slate-500">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-400" />
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-5 space-y-2">
          <button
            onClick={() => {
              onOpenModal('how-it-works');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/70 transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => {
              onOpenModal('about');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/70 transition-colors"
          >
            About RuralFlow
          </button>
          <button
            onClick={() => {
              onOpenModal('contact');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/70 transition-colors"
          >
            Contact & Helpline
          </button>
          
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-3">
            <span>Smart India Hackathon</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Sparkles className="w-3 h-3" /> End-to-End Flow Active
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
