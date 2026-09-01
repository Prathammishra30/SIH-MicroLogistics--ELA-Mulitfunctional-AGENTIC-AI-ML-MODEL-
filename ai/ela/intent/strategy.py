# Multilingual Optimization Strategy Extraction (Phase 8.1 Intelligence Hardening)
import re
from typing import Optional, Literal

OptimizationStrategy = Literal[
    'CHEAPEST',
    'FASTEST',
    'BALANCED',
    'FRESHNESS',
    'MAX_EARNINGS',
    'HIGHEST_RELIABILITY',
]


class StrategyExtractor:
    """
    Robust native multilingual extractor for user optimization strategies across 8 Indic languages + Hinglish.
    Does NOT rely on English translation intermediate.
    """

    # 1. CHEAPEST Strategy Patterns
    CHEAPEST_PATTERNS = [
        # English
        r'\b(?:cheapest|cheaper|lowest\s*cost|least\s*expensive|budget|economical|min(?:imum)?\s*fare|min(?:imum)?\s*cost|low\s*price)\b',
        # Hinglish / Latin
        r'\b(?:sabse\s*sasta|saste\s*me|sasta|kam\s*kharch|kam\s*paisa|kam\s*paise|kam\s*daam|kam\s*bhada|sasti\s*gadi|sasta\s*option)\b',
        # Hindi (Devanagari)
        r'(?:सबसे\s*सस्ता|कम\s*खर्च|खर्च\s*कम|खर्च\s*कम\s*रखना|कम\s*किराया|सस्ता|किफायती|कम\s*दाम|कम\s*पैसे|सस्ते\s*में)',
        # Marathi
        r'(?:सर्वात\s*स्वस्त|कमी\s*खर्च|खर्च\s*कमी|स्वस्त|किफायतशीर|कमी\s*भाडे|कमी\s*पैसे)',
        # Tamil
        r'(?:குறைந்த\s*செலவு|மலிவான|குறைந்த\s*கட்டணம்|குறைந்த\s*விலை)',
        # Telugu
        r'(?:తక్కువ\s*ఖర్చు|చౌకైన|తక్కువ\s*ధర|తక్కువ\s*చార్జీ)',
        # Bengali
        r'(?:সবচেয়ে\s*সস্তা|কম\s*খরচ|সাশ্রয়ী|কম\s*ভাড়া)',
        # Kannada
        r'(?:ಅಗ್ಗದ|ಕಡಿಮೆ\s*ವೆಚ್ಚ|ಕಡಿಮೆ\s*ಬಾಡಿಗೆ|ಕಡಿಮೆ\s*ದರ)',
    ]

    # 2. FASTEST Strategy Patterns
    FASTEST_PATTERNS = [
        # English
        r'\b(?:fastest|quickest|as\s*soon\s*as\s*possible|asap|urgent|speedy|express|fast\s*delivery|quick\s*transit)\b',
        # Hinglish / Latin
        r'\b(?:jaldi|jaldi\s*bhejna|jaldi\s*pahunchana|turant|lagaatar|urgent|jald\s*se\s*jald)\b',
        # Hindi (Devanagari)
        r'(?:जल्दी\s*पहुंचना|जल्दी\s*भेजना|जल्दी|शीघ्र|तेज|तुरंत|जल्द\s*से\s*जल्द)',
        # Marathi
        r'(?:लवकर|तातडीने|तात्काळ|जलद|लवकरात\s*लवकर|तात्काळ\s*वाहतूक)',
        # Tamil
        r'(?:விரைவாக|சீக்கிரம்|அவசரம்|விரைவான\s*டெலிவரி)',
        # Telugu
        r'(?:త్వరగా|వేగంగా|అత్యవసరం|వెంటనే)',
        # Bengali
        r'(?:তাড়াতাড়ি|দ্রুত|জরুরি|অবিলম্বে)',
        # Kannada
        r'(?:ಬೇಗ|ತ್ವರಿತವಾಗಿ|ತುರ್ತು|ಶೀಘ್ರ)',
    ]

    # 3. HIGHEST RELIABILITY Strategy Patterns
    RELIABILITY_PATTERNS = [
        # English
        r'\b(?:highest\s*reliability|reliable|safest|safe\s*delivery|best\s*rated|secure|trusted|top\s*quality|zero\s*damage)\b',
        # Hinglish / Latin
        r'\b(?:sabse\s*surakshit|surakshit|bharosemand|safe|trusted|achhi\s*gadi|accha\s*driver)\b',
        # Hindi (Devanagari)
        r'(?:सबसे\s*सुरक्षित|भरोसेमंद|विश्वसनीय|सुरक्षित\s*डिलीवरी|सुरक्षा|सुरक्षित)',
        # Marathi
        r'(?:सर्वात\s*सुरक्षित|विश्वासू|विश्वासार्ह|सुरक्षित\s*वाहतूक|सुरक्षित)',
        # Tamil
        r'(?:நம்பகமான|பாதுகாப்பான|உறுதியான|பாதுகாப்பு)',
        # Telugu
        r'(?:నమ్మకమైన|సురక్షితమైన|భద్రమైన|సురక్షిత)',
        # Bengali
        r'(?:সবচেয়ে\s*নির্ভরযোগ্য|নিরাপদ|বিশ্বস্ত|সুরক্ষা)',
        # Kannada
        r'(?:ವಿಶ್ವಾಸಾರ್ಹ|ಸುರಕ್ಷಿತ|ಖಚಿತ|ಭದ್ರ)',
    ]

    # 4. MAX EARNINGS Strategy Patterns
    MAX_EARNINGS_PATTERNS = [
        # English
        r'\b(?:maximum\s*earnings|max\s*profit|best\s*price|highest\s*profit|max\s*revenue|higher\s*income|best\s*rate)\b',
        # Hinglish / Latin
        r'\b(?:jyada\s*kamai|jyada\s*munafa|jyada\s*fayda|max\s*kamai|zyada\s*kamai|jyada\s*paisa)\b',
        # Hindi (Devanagari)
        r'(?:ज्यादा\s*कमाई|अधिक\s*मुनाफा|ज्यादा\s*फायदा|अधिक\s*आय|ज्यादा\s*पैसे)',
        # Marathi
        r'(?:जास्त\s*कमाई|अधिक\s*नफा|जास्त\s*फायदा|जास्त\s*उत्पन्न)',
        # Tamil
        r'(?:அதிக\s*வருமானம்|அதிக\s*லாபம்|அதிக\s*வருவாய்)',
        # Telugu
        r'(?:గరిష్ట\s*ఆదాయం|ఎక్కువ\s*లాభం|ఎక్కువ\s*ఆదాయం)',
        # Bengali
        r'(?:সর্বোচ্চ\s*আয়|বেশি\s*লাভ|অধিক\s*উপার্জন)',
        # Kannada
        r'(?:ಗರಿಷ್ಠ\s*ಗಳಿಕೆ|ಹೆಚ್ಚು\s*ಲಾಭ|ಹೆಚ್ಚು\s*ಆದಾಯ)',
    ]

    # 5. FRESHNESS Strategy Patterns
    FRESHNESS_PATTERNS = [
        # English
        r'\b(?:freshness|fresh\s*produce|fresh\s*crops|perishable|keep\s*fresh|prevent\s*spoilage)\b',
        # Hinglish / Latin
        r'\b(?:taza|fresh|kharab\s*hone\s*wala|kharab\s*na\s*ho)\b',
        # Hindi (Devanagari)
        r'(?:ताज़ा|ताजा\s*माल|खराब\s*होने\s*वाला\s*माल|ताजा)',
        # Marathi
        r'(?:ताजे|ताजा\s*माल|नाशवंत|खराब\s*होणारा\s*माल)',
        # Tamil
        r'(?:புதிய|பழையதாகாமல்|கெட்டுப்போகாமல்)',
        # Telugu
        r'(?:తాజా|పాడవకుండా|తాజా\s*పంట)',
        # Bengali
        r'(?:তাজা|পচনশীল|নষ্ট\s*না\s*হওয়া)',
        # Kannada
        r'(?:ತಾಜಾ|ಹಾಳಾಗದಂತೆ|ತಾಜಾ\s*ಉತ್ಪನ್ನ)',
    ]

    @classmethod
    def extract_strategy(cls, text: str, fallback: str = "BALANCED") -> OptimizationStrategy:
        """
        Extracts optimization strategy from natural language input.
        Returns one of: CHEAPEST, FASTEST, HIGHEST_RELIABILITY, MAX_EARNINGS, FRESHNESS, BALANCED.
        """
        if not text:
            return fallback  # type: ignore

        norm = text.lower()

        # Check in priority order: CHEAPEST -> FASTEST -> RELIABILITY -> EARNINGS -> FRESHNESS
        for pat in cls.CHEAPEST_PATTERNS:
            if re.search(pat, norm, re.IGNORECASE) or re.search(pat, text):
                return "CHEAPEST"

        for pat in cls.FASTEST_PATTERNS:
            if re.search(pat, norm, re.IGNORECASE) or re.search(pat, text):
                return "FASTEST"

        for pat in cls.RELIABILITY_PATTERNS:
            if re.search(pat, norm, re.IGNORECASE) or re.search(pat, text):
                return "HIGHEST_RELIABILITY"

        for pat in cls.MAX_EARNINGS_PATTERNS:
            if re.search(pat, norm, re.IGNORECASE) or re.search(pat, text):
                return "MAX_EARNINGS"

        for pat in cls.FRESHNESS_PATTERNS:
            if re.search(pat, norm, re.IGNORECASE) or re.search(pat, text):
                return "FRESHNESS"

        return fallback  # type: ignore
