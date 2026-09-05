# ELA Security Shield & Credential Protection (Phase 4 Python Core)
import re
from typing import Dict, Any, List
from ai.ela.agent.state import SafetyCheckResult, UserRole


class SecurityGuard:
    # Credential patterns to shield: passwords, OTPs, PINs, auth tokens
    CREDENTIAL_PATTERNS = [
        r'(?:password|pass|पासवर्ड|संकेतशब्द|கடவுச்சொல்|పాస్‌వర్డ్|পাসওয়ার্ড|ಪಾಸ್‌ವರ್ಡ್)\s*(?:is|=|:)?\s*([^\s]{4,})',
        r'(?:otp|one\s*time\s*password|ओटीपी|पडताळणी\s*कोड|ஒடிபி|ఓటీపీ|ওটিপি|ಒಟಿಪಿ)\s*(?:is|=|:)?\s*(\d{4,8})',
        r'(?:pin|mpin|पिन|ரகசிய\s*எண்|పిన్|পিন|ಪಿನ್)\s*(?:is|=|:)?\s*(\d{4,6})',
        r'\b(?:mypassword|secret123|kisan@123|admin123)\b',
        r'\bBearer\s+[a-zA-Z0-9_\-\.]+',
    ]

    INJECTION_PATTERNS = [
        r'ignore\s+previous\s+instructions',
        r'disregard\s+all\s+rules',
        r'system\s+override',
        r'you\s+are\s+now\s+admin',
        r'drop\s+table',
        r'bypass\s+security',
    ]

    @classmethod
    def check_safety(cls, text: str, authenticated_role: UserRole = 'GUEST') -> SafetyCheckResult:
        res = SafetyCheckResult()
        norm = text.lower()

        # 1. Check for sensitive credentials
        for pat in cls.CREDENTIAL_PATTERNS:
            if re.search(pat, text, re.IGNORECASE):
                res.credential_shielded = True
                res.warnings.append("Sensitive credentials detected in input.")
                break

        # 2. Check for prompt injection
        for pat in cls.INJECTION_PATTERNS:
            if re.search(pat, norm):
                res.prompt_injection_detected = True
                res.warnings.append("Potential prompt injection pattern detected.")
                break

        # 3. Check for role escalation attempt
        if re.search(r'give me admin|make me admin|switch to admin|grant all access', norm):
            if authenticated_role != 'ADMIN':
                res.unauthorized_attempt = True
                res.warnings.append("Unauthorized role escalation attempt.")

        return res

    @classmethod
    def sanitize_for_audit(cls, text: str) -> str:
        sanitized = text
        for pat in cls.CREDENTIAL_PATTERNS:
            sanitized = re.sub(pat, r'[REDACTED_CREDENTIAL]', sanitized, flags=re.IGNORECASE)
        return sanitized
