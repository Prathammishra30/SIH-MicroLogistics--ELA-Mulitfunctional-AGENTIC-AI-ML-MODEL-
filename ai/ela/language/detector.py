# Multilingual Script and Language Detector (Phase 4 Python Core)
# Native support across 7 Indian languages + English & Hinglish
import re
from typing import Tuple


def detect_language_script(text: str) -> Tuple[str, str]:
    """
    Detects language and script from text semantically and via unicode code charts.
    Returns (language_code, script_name).
    Supported languages:
    - 'hi': Hindi (Devanagari)
    - 'mr': Marathi (Devanagari)
    - 'ta': Tamil (Tamil)
    - 'te': Telugu (Telugu)
    - 'bn': Bengali (Bengali)
    - 'kn': Kannada (Kannada)
    - 'en': English (Latin)
    - 'hinglish': Hindi in Latin script
    """
    if not text or not text.strip():
        return "en", "Latin"

    # Unicode script ranges
    devanagari_count = len(re.findall(r"[\u0900-\u097F]", text))
    tamil_count = len(re.findall(r"[\u0B80-\u0BFF]", text))
    telugu_count = len(re.findall(r"[\u0C00-\u0C7F]", text))
    bengali_count = len(re.findall(r"[\u0980-\u09FF]", text))
    kannada_count = len(re.findall(r"[\u0C80-\u0CFF]", text))

    counts = {
        "tamil": (tamil_count, "ta", "Tamil"),
        "telugu": (telugu_count, "te", "Telugu"),
        "bengali": (bengali_count, "bn", "Bengali"),
        "kannada": (kannada_count, "kn", "Kannada"),
        "devanagari": (devanagari_count, "hi", "Devanagari"),
    }

    best_script = max(counts.keys(), key=lambda k: counts[k][0])
    if counts[best_script][0] >= 2:
        _, lang, script = counts[best_script]
        # Distinguish Marathi vs Hindi in Devanagari script via specific lexical markers
        if script == "Devanagari":
            marathi_markers = ["आहे", "माझे", "मला", "नाही", "पाहिजे", "शेतकरी", "गाडी", "करा", "द्या", "काय", "आणि"]
            if any(m in text for m in marathi_markers):
                return "mr", "Devanagari"
            return "hi", "Devanagari"
        return lang, script

    # Check for Hinglish patterns in Latin text
    t_lower = text.lower()
    hinglish_markers = [
        "karna", "chahiye", "bhejna", "mera", "meri", "mere", "paas", "hai", "hain",
        "karo", "bhai", "kisan", "hoon", "tamatar", "mandi", "bhav", "kya", "kitna",
        "kaise", "gaadi", "daam", "mujhe", "humko", "apna", "shuru"
    ]
    marathi_latin_markers = [
        "ahe", "pahije", "pathva", "majhe", "mala", "shetkari", "gadi", "dya", "kay"
    ]

    if any(re.search(rf"\b{m}\b", t_lower) for m in marathi_latin_markers):
        return "mr", "Latin"

    if any(re.search(rf"\b{m}\b", t_lower) for m in hinglish_markers):
        return "hi", "Latin"

    return "en", "Latin"
