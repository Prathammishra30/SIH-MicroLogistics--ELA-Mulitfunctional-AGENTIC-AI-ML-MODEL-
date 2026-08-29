# Prompt Injection Sanitizer and Defense (Phase 4 Python Core)
import re


INJECTION_PATTERNS = [
    r'ignore\s+(?:all\s+)?previous\s+instructions',
    r'disregard\s+all\s+(?:rules|constraints)',
    r'system\s+override',
    r'you\s+are\s+now\s+admin',
    r'drop\s+table\s+[a-z_]+',
    r'bypass\s+security',
    r'developer\s+mode\s+enabled',
]


def detect_prompt_injection(text: str) -> bool:
    norm = text.lower()
    return any(re.search(pat, norm) for pat in INJECTION_PATTERNS)
