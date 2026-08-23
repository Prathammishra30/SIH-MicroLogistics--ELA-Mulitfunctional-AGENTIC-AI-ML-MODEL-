export type RoleType = 'farmer' | 'transporter' | 'buyer';

export interface RoleConfig {
  id: RoleType;
  title: string;
  tagline: string;
  description: string;
  ctaText: string;
  badge: string;
  route: string;
  accentColor: {
    primary: string;
    border: string;
    bgHover: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
    iconBg: string;
    iconColor: string;
  };
  featuresPreview: string[];
}

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'kn';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export type ModalType = 'how-it-works' | 'about' | 'contact' | null;
