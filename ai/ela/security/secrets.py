# Credential Masking and Secret Protection (Phase 4 Python Core)
import re


CREDENTIAL_PATTERNS = [
    r'(?:password|pass|पासवर्ड|संकेतशब्द|கடவுச்சொல்|పాస్‌వర్డ్|পাসওয়ার্ড|ಪಾಸ್‌ವರ್ಡ್)\s*(?:is|=|:)?\s*([^\s]{4,})',
    r'(?:otp|one\s*time\s*password|ओटीपी|पडताळणी\s*कोड|ஒடிபி|ఓటీపీ|ওটিপি|ಒಟಿಪಿ)\s*(?:is|=|:)?\s*(\d{4,8})',
    r'(?:pin|mpin|पिन|ரகசிய\s*எண்|పిన్|পিন|ಪಿನ್)\s*(?:is|=|:)?\s*(\d{4,6})',
    r'\b(?:mypassword|secret123|kisan@123|admin123)\b',
    r'bearer\s+[A-Za-z0-9\-\._~\+\/]+=*',
]


def redact_secrets(text: str) -> str:
    redacted = text
    for pat in CREDENTIAL_PATTERNS:
        redacted = re.sub(pat, "[REDACTED_CREDENTIAL]", redacted, flags=re.IGNORECASE)
    return redacted


def contains_secrets(text: str) -> bool:
    return any(re.search(pat, text, re.IGNORECASE) for pat in CREDENTIAL_PATTERNS)
