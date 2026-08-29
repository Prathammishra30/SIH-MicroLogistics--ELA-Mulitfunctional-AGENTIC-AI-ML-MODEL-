# Entity Normalization and Canonical Vocabulary Mapping (Phase 4 Python Core)
from typing import Dict, Any


COMMODITY_SYNONYMS: Dict[str, str] = {
    # Tomatoes
    "tamatar": "Tomatoes",
    "टमाटर": "Tomatoes",
    "टोमॅटो": "Tomatoes",
    "தக்காளி": "Tomatoes",
    "టమోటా": "Tomatoes",
    "টমেটো": "Tomatoes",
    "ಟೊಮೆಟೊ": "Tomatoes",
    "tomato": "Tomatoes",
    "tomatoes": "Tomatoes",
    
    # Onions
    "pyaaz": "Onions",
    "pyaz": "Onions",
    "प्याज": "Onions",
    "कांदा": "Onions",
    "வெங்காயம்": "Onions",
    "ఉల్లిపాయలు": "Onions",
    "পেঁয়াজ": "Onions",
    "ಈರುಳ್ಳಿ": "Onions",
    "onion": "Onions",
    "onions": "Onions",

    # Potatoes
    "aaloo": "Potatoes",
    "aalu": "Potatoes",
    "आलू": "Potatoes",
    "बटाटा": "Potatoes",
    "உருளைக்கிழங்கு": "Potatoes",
    "బంగాళాదుంప": "Potatoes",
    "আলু": "Potatoes",
    "ಆಲೂಗಡ್ಡೆ": "Potatoes",
    "potato": "Potatoes",
    "potatoes": "Potatoes",
}


def normalize_commodity_name(raw_name: str) -> str:
    if not raw_name:
        return ""
    cleaned = raw_name.strip().lower()
    return COMMODITY_SYNONYMS.get(cleaned, raw_name.strip().capitalize())


def normalize_quantity_to_kg(quantity: float, unit: str) -> float:
    u = unit.lower().strip()
    if u in ["ton", "tons", "tonne", "tonnes", "टन", "டன்", "ಟನ್"]:
        return quantity * 1000.0
    if u in ["quintal", "quintals", "क्विंटल", "క్వింటాల్"]:
        return quantity * 100.0
    return quantity
