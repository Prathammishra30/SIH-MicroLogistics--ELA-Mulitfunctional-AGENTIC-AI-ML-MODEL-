# Multilingual & Indic Numeral Entity Extractor (Phase 4 Python Core)
import re
from typing import Optional, Dict, Any
from ai.ela.agent.state import CanonicalEntities


class EntityExtractor:
    INDIC_DIGIT_MAP = {
        # Devanagari / Hindi / Marathi
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
        # Tamil
        '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
        '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
        # Telugu
        '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
        '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
        # Bengali
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '೬': '6', '৭': '7', '৮': '8', '৯': '9',
        # Kannada
        '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4',
        '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
    }

    CROP_KEYWORDS = {
        'tomato': 'Tomatoes',
        'tomatoes': 'Tomatoes',
        'tamatar': 'Tomatoes',
        'टमाटर': 'Tomatoes',
        'टोमॅटो': 'Tomatoes',
        'தக்காளி': 'Tomatoes',
        'టమాటాలు': 'Tomatoes',
        'টমেটো': 'Tomatoes',
        'ಟೊಮೆಟೊ': 'Tomatoes',
        'onion': 'Onions',
        'onions': 'Onions',
        'pyaz': 'Onions',
        'kanda': 'Onions',
        'कांदा': 'Onions',
        'प्याज': 'Onions',
        'வெங்காயம்': 'Onions',
        'ఉల్లిపాయలు': 'Onions',
        'পেঁয়াজ': 'Onions',
        'ಈರುಳ್ಳಿ': 'Onions',
        'potato': 'Potatoes',
        'potatoes': 'Potatoes',
        'aalu': 'Potatoes',
        'alu': 'Potatoes',
        'batata': 'Potatoes',
        'बटाटा': 'Potatoes',
        'आलू': 'Potatoes',
        'உருளைக்கிழங்கு': 'Potatoes',
        'బంగాళాదుంప': 'Potatoes',
        'আলু': 'Potatoes',
        'ಆಲೂಗಡ್ಡೆ': 'Potatoes',
        'wheat': 'Wheat',
        'gehu': 'Wheat',
        'गहू': 'Wheat',
        'गेहूं': 'Wheat',
        'गेहूँ': 'Wheat',
        'கோதுமை': 'Wheat',
        'గోధుమలు': 'Wheat',
        'গম': 'Wheat',
        'ಗೋಧಿ': 'Wheat',
        'rice': 'Rice',
        'chawal': 'Rice',
        'तांदूळ': 'Rice',
        'चावल': 'Rice',
        'அரிசி': 'Rice',
        'బియ్యం': 'Rice',
        'চাল': 'Rice',
        'ಅಕ್ಕಿ': 'Rice',
    }

    DESTINATIONS = {
        'pune': 'Pune APMC Mandi',
        'mumbai': 'Mumbai Vashi Market',
        'nashik': 'Nashik',
        'nagpur': 'Nagpur Cotton Market',
        'kolhapur': 'Kolhapur Shahupuri Mandi',
        'पुणे': 'Pune APMC Mandi',
        'मुंबई': 'Mumbai Vashi Market',
        'नाशिक': 'Nashik',
        'புனே': 'Pune APMC Mandi',
        'மும்பை': 'Mumbai Vashi Market',
        'పూణే': 'Pune APMC Mandi',
        'ముంబై': 'Mumbai Vashi Market',
        'পুনে': 'Pune APMC Mandi',
        'ಮುಂಬೈ': 'Mumbai Vashi Market',
        'ಪುಣೆ': 'Pune APMC Mandi',
    }

    VEHICLE_PATTERNS = [
        (r'mini\s*truck|छोटा\s*हाथी|छोटा\s*ट्रक|மினி\s*டிரக்|మినీ\s*ట్రక్', 'Mini Truck (750 kg)'),
        (r'pickup|पिकअप|पिक\s*अप|பிக்கப்|పికప్', 'Pickup (1.5 Ton)'),
        (r'large\s*truck|open\s*truck|बड़ा\s*ट्रक|मोठा\s*ट्रक|பெரிய\s*டிரக்|పెద్ద\s*ట్రక్', 'Large Truck (10 Ton)'),
        (r'truck|ट्रक|गाडी|गाड़ी|வாகனம்|ట్రక్కు', 'Mini Truck (750 kg)'),
    ]

    @classmethod
    def normalize_digits(cls, text: str) -> str:
        res = []
        for ch in text:
            res.append(cls.INDIC_DIGIT_MAP.get(ch, ch))
        return "".join(res)

    @classmethod
    def extract_entities(cls, text: str) -> CanonicalEntities:
        normalized_text = cls.normalize_digits(text)
        entities = CanonicalEntities()

        # 1. Product / Commodity Extraction
        for kw, canonical_crop in cls.CROP_KEYWORDS.items():
            if re.search(r'\b' + re.escape(kw) + r'\b', text, re.IGNORECASE) or kw in text:
                entities.product = canonical_crop
                entities.commodity = canonical_crop.lower()
                break

        # 2. Quantity & Unit Extraction
        # Look for patterns like "500 kg", "2 ton", "50 quintal", "1000 கிலோ"
        qty_pattern = re.search(
            r'(\d+(?:\.\d+)?)\s*(kg|kilo|किलो|किग्रा|टन|ton|tons|क्विंटल|quintal|quintals|கிலோ|டன்|క్వింటా|కిలో|কেজি|টন|ಕೆಜಿ|ಟನ್)',
            normalized_text,
            re.IGNORECASE,
        )
        if qty_pattern:
            entities.quantity = float(qty_pattern.group(1))
            unit_raw = qty_pattern.group(2).lower()
            if any(u in unit_raw for u in ['ton', 'टन', 'டன்', 'টন', 'ಟನ್']):
                entities.unit = 'ton'
            elif any(u in unit_raw for u in ['quintal', 'क्विंटल', 'క్వింటా']):
                entities.unit = 'quintal'
            else:
                entities.unit = 'kg'
        else:
            # Fallback numeric match
            num_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:bags|पोती|बोरी)?', normalized_text)
            if num_match:
                val = float(num_match.group(1))
                if val > 5 and val < 50000:
                    entities.quantity = val
                    entities.unit = 'kg'

        # 3. Location & Destination Extraction
        loc_matches = []
        for kw, canonical_dest in cls.DESTINATIONS.items():
            for m in re.finditer(r'\b' + re.escape(kw) + r'\b', text, re.IGNORECASE):
                loc_matches.append((m.start(), kw, canonical_dest))
            if kw in text and not any(kw == item[1] for item in loc_matches):
                loc_matches.append((text.find(kw), kw, canonical_dest))

        loc_matches.sort(key=lambda x: x[0])
        if len(loc_matches) >= 2:
            entities.pickup_location = loc_matches[0][2]
            entities.destination = loc_matches[1][2]
        elif len(loc_matches) == 1:
            loc_idx, kw, canonical_dest = loc_matches[0]
            preceding_context = text[max(0, loc_idx - 10):loc_idx].lower()
            following_context = text[loc_idx:min(len(text), loc_idx + len(kw) + 10)].lower()
            if any(p in preceding_context for p in ['in ', 'at ', 'from ']) or any(f in following_context for f in ['से', 'हून', 'ून']):
                entities.pickup_location = canonical_dest
                entities.destination = canonical_dest
            else:
                entities.destination = canonical_dest
                entities.pickup_location = canonical_dest

        # 4. Vehicle Type Extraction
        for pat, v_type in cls.VEHICLE_PATTERNS:
            if re.search(pat, text, re.IGNORECASE):
                entities.vehicle_type = v_type
                break

        # 5. Vehicle Registration Number (e.g., MH 12 AB 1234)
        reg_match = re.search(
            r'([A-Z]{2}\s*\d{1,2}\s*[A-Z]{0,3}\s*\d{3,4})',
            normalized_text,
            re.IGNORECASE,
        )
        if reg_match:
            entities.vehicle_reg_no = reg_match.group(1).upper()

        # 6. Price per unit (e.g., ₹40/kg, 40 per kg, 35 रुपये)
        price_match = re.search(
            r'(?:₹|rs\.?|inr|दर|भाव|விலை|ధర)?\s*(\d+(?:\.\d+)?)\s*(?:/|\s*per|\s*प्रति|\s*रुपये|\s*₹)?\s*(?:kg|kilo|ton)?',
            normalized_text,
            re.IGNORECASE,
        )
        if price_match:
            try:
                p_val = float(price_match.group(1))
                if 10 <= p_val <= 5000 and p_val != entities.quantity:
                    entities.price_per_unit = p_val
            except Exception:
                pass

        # 7. Grade (Grade A, Grade B, Premium)
        grade_match = re.search(r'(grade\s*[ab]|premium|standard|ए\s*ग्रेड|बी\s*ग्रेड)', text, re.IGNORECASE)
        if grade_match:
            g = grade_match.group(1).lower()
            if 'a' in g or 'ए' in g:
                entities.grade = 'A'
            elif 'b' in g or 'बी' in g:
                entities.grade = 'B'
            elif 'premium' in g:
                entities.grade = 'Premium'
            else:
                entities.grade = 'Standard'

        # 8. Optimization Strategy Extraction
        from ai.ela.intent.strategy import StrategyExtractor
        entities.strategy = StrategyExtractor.extract_strategy(text)

        return entities
