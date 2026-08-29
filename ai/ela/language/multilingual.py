# Multilingual Localization and Semantic Dictionaries (Phase 4 Python Core)
from typing import Dict, Any


MULTILINGUAL_LEXICON: Dict[str, Dict[str, str]] = {
    "hi": {
        "welcome": "नमस्ते! मैं ELA हूँ — आपकी AgriRoute Intelligence Assistant। आज मैं आपकी क्या मदद करूँ?",
        "ask_pickup": "माल भेजने के लिए पिकअप स्थान (Pickup Location) क्या है?",
        "ask_destination": "माल कहाँ पहुँचाना है? (Destination Mandi / City)?",
        "ask_quantity": "फसल की मात्रा (किलो/टन) कितनी है?",
        "clarification": "कृपया मुझे बताएं कि आप क्या भेजना चाहते हैं और कहाँ?",
        "confirmation_prompt": "क्या मैं यह अनुरोध आगे बढ़ाऊँ?",
        "action_completed": "कार्य सफलतापूर्वक संपन्न हो गया है।",
        "shield_secret": "कृपया पासवर्ड या ओटीपी चैट में न भेजें। अपनी सुरक्षा के लिए सीधे सुरक्षित लॉगिन फॉर्म का उपयोग करें।",
    },
    "mr": {
        "welcome": "नमस्कार! मी ELA — तुमची AgriRoute Intelligence सहाय्यक. आज मी तुम्हाला कशी मदत करू?",
        "ask_pickup": "माल उचलण्याचे ठिकाण (Pickup Location) कोणते आहे?",
        "ask_destination": "माल कोठे पाठवायचा आहे? (गंतव्य मंडी/शहर)?",
        "ask_quantity": "मालाचे प्रमाण (किलो/टन) किती आहे?",
        "clarification": "कृपया सांगा की तुम्हाला काय पाठवायचे आहे आणि कोठे?",
        "confirmation_prompt": "मी ही विनंती पुढे पाठवू का?",
        "action_completed": "कार्य यशस्वीरित्या पूर्ण झाले आहे.",
        "shield_secret": "कृपया पासवर्ड किंवा ओटीपी चॅटमध्ये पाठवू नका. थेट सुरक्षित फॉर्म वापरा.",
    },
    "ta": {
        "welcome": "வணக்கம்! நான் ELA — உங்கள் அக்ரிரூட் நுண்ணறிவு உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
        "ask_pickup": "பொருட்களை எடுக்கும் இடம் (Pickup Location) என்ன?",
        "ask_destination": "பொருட்கள் எங்கு செல்ல வேண்டும்?",
        "ask_quantity": "பொருளின் அளவு (கிலோ/டன்) எவ்வளவு?",
        "clarification": "தயவுசெய்து நீங்கள் எங்கு, என்ன அனுப்ப வேண்டும் என்பதை தெளிவுபடுத்தவும்.",
        "confirmation_prompt": "நான் இந்த கோரிக்கையை உறுதிப்படுத்தலாமா?",
        "action_completed": "செயல் வெற்றிகரமாக முடிந்தது.",
        "shield_secret": "கடவுச்சொல் அல்லது OTP-யை பகிர வேண்டாம்.",
    },
    "te": {
        "welcome": "నమస్కారం! నేను ELA — మీ అగ్రిరూట్ ఇంటెలిజెన్స్ అసిస్టెంట్. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
        "ask_pickup": "పికప్ లొకేషన్ ఎక్కడ?",
        "ask_destination": "సరుకు ఎక్కడికి పంపాలి?",
        "ask_quantity": "సరుకు పరిమాణం (కేజీలు/టన్నులు) ఎంత?",
        "clarification": "దయచేసి మీరు ఏమి మరియు ఎక్కడికి పంపాలనుకుంటున్నారో తెలియజేయండి.",
        "confirmation_prompt": "నేను ఈ అభ్యర్థనను కొనసాగించవచ్చా?",
        "action_completed": "పని విజయవంతంగా పూర్తయింది.",
        "shield_secret": "దయచేసి పాస్‌వర్డ్ లేదా OTP ఇక్కడ నమోదు చేయవద్దు.",
    },
    "bn": {
        "welcome": "নমস্কার! আমি ELA — আপনার অ্যাগ্রিরুট ইন্টেলিজেন্স সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
        "ask_pickup": "পণ্য তোলার স্থান (Pickup Location) কোথায়?",
        "ask_destination": "পণ্য কোথায় পাঠাতে হবে?",
        "ask_quantity": "ফসলের পরিমাণ (কেজি/টন) কত?",
        "clarification": "দয়া করে আপনি কী এবং কোথায় পাঠাতে চান তা স্পষ্ট করুন।",
        "confirmation_prompt": "আমি কি এই অনুরোধটি নিশ্চিত করব?",
        "action_completed": "কাজটি সফলভাবে সম্পন্ন হয়েছে।",
        "shield_secret": "অনুগ্রহ করে পাসওয়ার্ড বা ওটিপি চ্যাটে পাঠাবেন না।",
    },
    "kn": {
        "welcome": "ನಮಸ್ಕಾರ! ನಾನು ELA — ನಿಮ್ಮ ಅಗ್ರಿರೌಟ್ ಇಂಟೆಲಿಜೆನ್ಸ್ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
        "ask_pickup": "ಪಿಕಪ್ ಸ್ಥಳ ಯಾವುದು?",
        "ask_destination": "ಸರಕು ಎಲ್ಲಿಗೆ ತಲುಪಿಸಬೇಕು?",
        "ask_quantity": "ಪ್ರಮಾಣ (ಕೆಜಿ/ಟನ್) ಎಷ್ಟು?",
        "clarification": "ದಯವಿಟ್ಟು ನೀವು ಏನನ್ನು ಎಲ್ಲಿಗೆ ಕಳುಹಿಸಬೇಕೆಂದು ಸ್ಪಷ್ಟಪಡಿಸಿ.",
        "confirmation_prompt": "ನಾನು ಈ ವಿನಂತಿಯನ್ನು ಮುಂದುವರಿಸಲಾ?",
        "action_completed": "ಕಾರ್ಯವು ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ.",
        "shield_secret": "ದಯವಿಟ್ಟು ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ಒಟಿಪಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
    },
    "en": {
        "welcome": "Hello! I'm ELA, your AgriRoute Intelligence Assistant. How can I help you today?",
        "ask_pickup": "What is the pickup location for your cargo?",
        "ask_destination": "Where should the shipment be delivered? (Destination Mandi / City)?",
        "ask_quantity": "What is the quantity of produce (kg / tons)?",
        "clarification": "Please specify what you would like to transport and the destination.",
        "confirmation_prompt": "Should I proceed with creating this request?",
        "action_completed": "Action completed successfully.",
        "shield_secret": "Please enter your password or OTP directly into the secure login form. ELA never handles authentication credentials.",
    }
}


def get_localized_phrase(lang: str, key: str) -> str:
    lang_dict = MULTILINGUAL_LEXICON.get(lang, MULTILINGUAL_LEXICON["en"])
    return lang_dict.get(key, MULTILINGUAL_LEXICON["en"].get(key, ""))
