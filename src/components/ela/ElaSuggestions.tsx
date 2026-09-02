/* eslint-disable react-refresh/only-export-components */
// ELA Suggestions Component & Helper
// Quick contextual prompt suggestions for Farmers, Buyers, and Transporters

import React from 'react';
import { Sparkles } from 'lucide-react';
import type { UserRole } from '../../services/api';

export function getDefaultSuggestions(role: UserRole | 'GUEST', lang: string): string[] {
  if (role === 'FARMER') {
    if (lang === 'mr') {
      return ['पिके नोंदवा', 'बाजार मागणी', 'वाहतूक मागवा', 'माझी डिलिव्हरी', 'भाव तपासा'];
    }
    if (lang === 'hi') {
      return ['फसल जोड़ें', 'मंडी मांग देखें', 'गाड़ी बुक करें', 'मेरी डिलीवरी', 'भाव देखें'];
    }
    return ['List a product', 'Market demand', 'Book transport', 'My deliveries', 'Price check'];
  }

  if (role === 'BUYER') {
    if (lang === 'mr') {
      return ['खरेदी मागणी नोंदवा', 'शेतमाल शोधा', 'माझ्या ऑर्डर्स', 'डिलिव्हरी तपासा'];
    }
    if (lang === 'hi') {
      return ['खरीद मांग पोस्ट करें', 'फसल खोजें', 'मेरे ऑर्डर', 'डिलीवरी ट्रैक करें'];
    }
    return ['Post procurement', 'Browse produce', 'My orders', 'Track delivery'];
  }

  if (role === 'TRANSPORTER') {
    if (lang === 'mr') {
      return ['उपलब्ध फेऱ्या', 'माझी वाहने', 'चालू ट्रिप्स', 'माझी कमाई'];
    }
    if (lang === 'hi') {
      return ['उपलब्ध ट्रिप्स', 'मेरी गाड़ियां', 'चालू फेरियां', 'मेरी कमाई'];
    }
    return ['Find loads', 'My vehicles', 'Active trips', 'My earnings'];
  }

  // Universal Public Landing Suggestions across all 7 Indian languages
  if (lang === 'hi') {
    return ['लॉगिन में मदद', 'मैं किसान हूँ', 'मैं खरीदार हूँ', 'मैं ट्रांसपोर्टर हूँ', 'एग्रीरूट कैसे काम करता है?'];
  }
  if (lang === 'mr') {
    return ['लॉगिन मदत', 'मी शेतकरी आहे', 'मी खरेदीदार आहे', 'मी वाहतूकदार आहे', 'अ‍ॅग्रीरूट कसे कार्य करते?'];
  }
  if (lang === 'ta') {
    return ['உள்நுழைய உதவுங்கள்', 'நான் விவசாயி', 'நான் வாங்குபவர்', 'நான் டிரான்ஸ்போர்ட்டர்', 'அக்ரிரூட் எவ்வாறு செயல்படுகிறது?'];
  }
  if (lang === 'te') {
    return ['లాగిన్ సహాయం', 'నేను రైతును', 'నేను కొనుగోలుదారుని', 'నేను రవాణాదారుని', 'అగ్రిరూట్ ఎలా పనిచేస్తుంది?'];
  }
  if (lang === 'bn') {
    return ['লগইন সাহায্য', 'আমি কৃষক', 'আমি ক্রেতা', 'আমি পরিবহনকারী', 'অ্যাগ্রিরুট কীভাবে কাজ করে?'];
  }
  if (lang === 'kn') {
    return ['ಲಾಗಿನ್ ಸಹಾಯ', 'ನಾನು ರೈತ', 'ನಾನು ಖರೀದಿದಾರ', 'ನಾನು ಸಾರಿಗೆದಾರ', 'ಅಗ್ರಿರೌಟ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?'];
  }

  return ['Help me login', "I'm a Farmer", "I'm a Buyer", "I'm a Transporter", 'How does AgriRoute work?'];
}

interface ElaSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  disabled?: boolean;
}

export const ElaSuggestions: React.FC<ElaSuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
  disabled = false,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-x">
      <div className="flex items-center gap-1.5 shrink-0 text-slate-400 text-xs font-medium pl-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      </div>
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {suggestions.map((suggestion, idx) => (
          <button
            key={`${suggestion}-${idx}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(suggestion)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-[#E8F5E9] text-slate-700 hover:text-[#1B5E20] border border-slate-200/80 hover:border-green-300 shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
